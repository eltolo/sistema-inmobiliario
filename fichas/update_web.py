import os
import json
import shutil
import re
import hashlib
import unicodedata
from pathlib import Path
from PIL import Image
import instagram_generator

# Configuración de rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(BASE_DIR, "web-propiedades")
PUBLIC_DIR = os.path.join(WEB_DIR, "public", "properties")
DATA_FILE = os.path.join(WEB_DIR, "src", "data", "properties.json")
CONFIG_FILE = os.path.join(BASE_DIR, "config.json")

def normalize_id(text: str) -> str:
    """Convierte un nombre a ASCII para usarlo como ID/URL sin problemas de encoding."""
    return ''.join(c for c in unicodedata.normalize('NFKD', text) if not unicodedata.combining(c))


def get_image_hash(file_path):
    """Genera un hash MD5 de la imagen para detectar duplicados."""
    hasher = hashlib.md5()
    with open(file_path, 'rb') as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

def parse_datos_raw(file_path):
    data = {}
    if not os.path.exists(file_path):
        return data
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = re.sub(r'^\d+→', '', line).strip()
            if ':' in line:
                key, value = line.split(':', 1)
                data[key.strip().lower()] = value.strip()
    return data

def formatear_precio(valor):
    if not valor or valor == 'Consultar' or valor == '0':
        return valor
    if valor.startswith('USD ') or valor.startswith('$ '):
        return valor
    return f'$ {valor}'

def update_web():
    print("Iniciando sincronización de propiedades...")
    
    # Leer config global
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        config_global = json.load(f)

    if not os.path.exists(PUBLIC_DIR):
        os.makedirs(PUBLIC_DIR)
    
    src_data_dir = os.path.dirname(DATA_FILE)
    if not os.path.exists(src_data_dir):
        os.makedirs(src_data_dir)

    properties = []
    
    for folder_name in os.listdir(BASE_DIR):
        folder_path = os.path.join(BASE_DIR, folder_name)
        
        if not os.path.isdir(folder_path) or folder_name in ("web-propiedades", "__pycache__") or folder_name.startswith('.'):
            continue
            
        prop_id = normalize_id(folder_name)
        print(f"Procesando: {folder_name} (id={prop_id})")
        
        datos_raw = parse_datos_raw(os.path.join(folder_path, "datos_raw.txt"))
        
        # Leer descripción
        desc_path = os.path.join(folder_path, "descripcion.txt")
        descripcion = ""
        if os.path.exists(desc_path):
            with open(desc_path, 'r', encoding='utf-8') as f:
                descripcion = f.read().replace("AUTO_GENERATED", "").strip()
        
        # Leer estado (ABM desde terminal)
        status_path = os.path.join(folder_path, "status.txt")
        status = "Disponible"
        if os.path.exists(status_path):
            with open(status_path, 'r') as f: status = f.read().strip()

        # tipo.txt sobreescribe el tipo scrapeado
        tipo_path = os.path.join(folder_path, "tipo.txt")
        if os.path.exists(tipo_path):
            with open(tipo_path, 'r', encoding='utf-8') as f:
                tipo_manual = f.read().strip()
                if tipo_manual:
                    datos_raw['tipo'] = tipo_manual

        target_prop_dir = os.path.join(PUBLIC_DIR, prop_id)
        if os.path.exists(target_prop_dir):
            shutil.rmtree(target_prop_dir)
        os.makedirs(target_prop_dir)
        os.makedirs(os.path.join(target_prop_dir, "images"))
        thumbs_dir = os.path.join(target_prop_dir, "thumbs")
        os.makedirs(thumbs_dir)
        
        image_list = []
        img_src_dir = os.path.join(folder_path, "Imagenes")
        hashes_vistos = set() # Para detectar duplicados por contenido

        if os.path.exists(img_src_dir):
            all_imgs = [f for f in os.listdir(img_src_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
            
            for img_name in all_imgs:
                img_path = os.path.join(img_src_dir, img_name)
                img_hash = get_image_hash(img_path)
                
                if img_hash not in hashes_vistos:
                    hashes_vistos.add(img_hash)
                    dst = os.path.join(target_prop_dir, "images", img_name)
                    shutil.copy2(img_path, dst)
                    image_list.append(f"/properties/{prop_id}/images/{img_name}")
                    # Generar thumbnail 400px
                    try:
                        thumb_path = os.path.join(thumbs_dir, img_name)
                        with Image.open(dst) as im:
                            im.thumbnail((400, 400), Image.LANCZOS)
                            im.save(thumb_path, "JPEG", quality=85)
                    except Exception:
                        pass
                else:
                    print(f"  - Imagen duplicada omitida: {img_name}")
        
        # Ordenar imágenes: primero las que tienen prefijo de categoría (ej: 01_frente_01.jpg),
        # luego alfabético, y dejar las que dicen 'optimized' al final.
        def _image_sort_key(img_path: str) -> tuple:
            lower = img_path.lower()
            basename = os.path.basename(lower)
            # Prefijo de categoría: dos dígitos + guion bajo + letras + guion bajo + dígitos
            has_category = bool(re.match(r"^\d{2}_[a-z_]+_\d+", basename))
            return (not has_category, "optimized" in lower, basename)

        image_list.sort(key=_image_sort_key)

        # Si existe cover.txt, la imagen indicada pasa a primer lugar (portada manual)
        cover_path = os.path.join(folder_path, "cover.txt")
        if os.path.exists(cover_path):
            try:
                with open(cover_path, 'r', encoding='utf-8') as f:
                    cover_filename = f.read().strip()
                if cover_filename:
                    cover_full = f"/properties/{prop_id}/images/{cover_filename}"
                    if cover_full in image_list:
                        image_list.remove(cover_full)
                        image_list.insert(0, cover_full)
                        print(f"  - Portada manual: {cover_filename}")
            except Exception as e:
                print(f"  - No se pudo leer cover.txt: {e}")

        audio_file = None
        audio_search_paths = [folder_path, os.path.join(folder_path, "tts_segments")]
        for search_path in audio_search_paths:
            if os.path.exists(search_path):
                for f_name in os.listdir(search_path):
                    if (f_name.startswith("narracion") or f_name.endswith(".wav")) and f_name.endswith(".wav"):
                        shutil.copy2(os.path.join(search_path, f_name), os.path.join(target_prop_dir, "narracion.wav"))
                        audio_file = f"/properties/{prop_id}/narracion.wav"
                        break
            if audio_file: break

        map_file = None
        mapa_src = os.path.join(folder_path, "mapa_interactivo.html")
        if os.path.exists(mapa_src):
            shutil.copy2(mapa_src, os.path.join(target_prop_dir, "mapa_interactivo.html"))
            map_file = f"/properties/{prop_id}/mapa_interactivo.html"

        # Generar contenido de Instagram
        instagram_card = None
        instagram_caption = None
        try:
            enriched = {**config_global, **datos_raw}
            enriched.update({
                "id": prop_id,
                "title": datos_raw.get("titulo", prop_id.replace("_", " ")),
                "address": datos_raw.get("direccion", prop_id.replace("_", " ")),
                "neighborhood": datos_raw.get("barrio", "Consultar"),
                "price": formatear_precio(datos_raw.get("precio", "Consultar")),
                "expenses": formatear_precio(datos_raw.get("expensas", "0")),
                "type": datos_raw.get("tipo", "Propiedad"),
                "operation": datos_raw.get("operacion", "Venta"),
                "total_area": datos_raw.get("metros_totales", "-"),
                "bedrooms": datos_raw.get("dormitorios", "-"),
                "bathrooms": datos_raw.get("banos", "-"),
                "images": image_list,
            })
            ig_dir = os.path.join(folder_path, "instagram")
            instagram_generator.generate_for_property(enriched, Path(ig_dir))

            public_ig_dir = os.path.join(target_prop_dir, "instagram")
            if os.path.exists(public_ig_dir):
                shutil.rmtree(public_ig_dir)
            os.makedirs(public_ig_dir)
            shutil.copy2(os.path.join(ig_dir, "card.jpg"), os.path.join(public_ig_dir, "card.jpg"))
            shutil.copy2(os.path.join(ig_dir, "caption.txt"), os.path.join(public_ig_dir, "caption.txt"))
            instagram_card = f"/properties/{prop_id}/instagram/card.jpg"
            instagram_caption = f"/properties/{prop_id}/instagram/caption.txt"
        except Exception as e:
            print(f"  - No se pudo generar contenido Instagram para {folder_name}: {e}")

        prop_obj = {
            "id": prop_id,
            "title": datos_raw.get("titulo", prop_id.replace("_", " ")),
            "address": datos_raw.get("direccion", prop_id.replace("_", " ")),
            "neighborhood": datos_raw.get("barrio", "Consultar"),
            "price": formatear_precio(datos_raw.get("precio", "Consultar")),
            "expenses": formatear_precio(datos_raw.get("expensas", "0")),
            "type": datos_raw.get("tipo", "Propiedad"),
            "operation": datos_raw.get("operacion", "Venta"),
            "status": status,
            "total_area": datos_raw.get("metros_totales", "-"),
            "covered_area": datos_raw.get("metros_cubiertos", "-"),
            "rooms": datos_raw.get("ambientes", "-"),
            "bedrooms": datos_raw.get("dormitorios", "-"),
            "bathrooms": datos_raw.get("banos", "-"),
            "luminoso": datos_raw.get("luminoso", ""),
            "location": datos_raw.get("ubicacion", "-"),
            "orientation": datos_raw.get("orientacion", "-"),
            "age": datos_raw.get("antiguedad", "-"),
            "description": descripcion,
            "images": image_list,
            "audio": audio_file,
            "map": map_file,
            "instagram_card": instagram_card,
            "instagram_caption": instagram_caption
        }
        properties.append(prop_obj)

    # Guardar JSON final con config global
    output = {
        "config": config_global,
        "properties": properties
    }
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"Sincronización completada. {len(properties)} propiedades procesadas.")

if __name__ == "__main__":
    update_web()
