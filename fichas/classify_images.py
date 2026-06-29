import os
import re
import base64
import io
import json
import shutil
from pathlib import Path
from typing import Dict, List, Tuple
from dotenv import load_dotenv
from PIL import Image
from openai import OpenAI

load_dotenv()

BASE_DIR = Path(__file__).parent
CATEGORIES: List[Tuple[str, str, str]] = [
    ("01_frente", "Frente de la propiedad", "fachada, exterior, frente del edificio, vista de la calle, entrada principal desde afuera"),
    ("02_ingreso_hall", "Ingreso o hall de entrada", "hall, recibidor, vestíbulo, entrada interior, recibidor de acceso"),
    ("03_puerta_pasillo", "Puerta de ingreso o pasillo de ingreso", "puerta de entrada, pasillo, corredor, distribución, acceso interno"),
    ("04_sala", "Sala principal", "living, sala, estar, living comedor, sala de estar, espacio principal"),
    ("05_balcon", "Balcón", "balcón, terraza, patio, vista exterior desde el interior, balcón a la calle"),
    ("06_dormitorio", "Dormitorios", "dormitorio, habitación, cuarto, suite, dormitorio principal"),
    ("07_cocina", "Cocina", "cocina, kitchen, office, cocina comedor, comedor diario"),
    ("08_bano", "Baños", "baño, toilette, inodoro, lavabo, ducha, baño completo, baño social"),
    ("99_otros", "Otros", "plano, mapa, imagen no clasificable, logo, render, texto, documento"),
]
CATEGORY_BY_CODE = {c[0]: c for c in CATEGORIES}
VALID_CODES = [c[0] for c in CATEGORIES]

def get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY no encontrada en variables de entorno")
    return OpenAI(api_key=api_key)


def encode_image(img_path: Path, max_size: int = 512) -> str:
    """Redimensiona la imagen y la devuelve como base64 JPEG."""
    with Image.open(img_path) as img:
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.thumbnail((max_size, max_size), Image.LANCZOS)
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def classify_image(client: OpenAI, img_path: Path) -> str:
    """Clasifica una imagen usando GPT-4o-mini. Devuelve el código de categoría."""
    encoded = encode_image(img_path)
    desc_lines = "\n".join(f"{code}: {name} - {examples}" for code, name, examples in CATEGORIES)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Sos un asistente experto en fotografía inmobiliaria. "
                    "Clasificá la siguiente imagen de una propiedad en UNA sola categoría. "
                    "Respondé ÚNICAMENTE con el código de la categoría (por ejemplo: 01_frente). "
                    "No agregues explicaciones ni texto extra.\n\n" + desc_lines
                ),
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{encoded}", "detail": "low"},
                    }
                ],
            },
        ],
        max_tokens=20,
        temperature=0.1,
    )

    answer = response.choices[0].message.content.strip().lower()
    for code in VALID_CODES:
        if code in answer:
            return code
    return "99_otros"


def load_classification(img_dir: Path) -> Dict[str, str]:
    classification_file = img_dir / "classification.json"
    if classification_file.exists():
        return json.loads(classification_file.read_text(encoding="utf-8"))
    return {}


def save_classification(img_dir: Path, classification: Dict[str, str]) -> None:
    classification_file = img_dir / "classification.json"
    classification_file.write_text(json.dumps(classification, indent=2, ensure_ascii=False), encoding="utf-8")


def _extract_category_from_filename(filename: str) -> str | None:
    """Extrae el código de categoría de un nombre como 01_frente_02.jpg."""
    match = re.match(r"^(\d{2}_[a-z_]+)_\d+", filename.lower())
    if match:
        return match.group(1)
    return None


def rename_images(img_dir: Path, classification: Dict[str, str]) -> None:
    """Renombra las imágenes según su categoría y elimina el prefijo anterior."""
    # Primero detectamos si hay imágenes ya renombradas: las renombramos a un nombre temporal único
    # para evitar colisiones al reordenar.
    temp_dir = img_dir / ".temp_classify"
    temp_dir.mkdir(exist_ok=True)

    # Mover todas las imágenes a temp con nombre seguro basado en el original
    image_files = [f for f in img_dir.iterdir() if f.is_file() and f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")]
    temp_map: Dict[str, Path] = {}
    for idx, f in enumerate(image_files, 1):
        temp_name = f"_tmp_{idx:04d}_{f.suffix}"
        temp_path = temp_dir / temp_name
        shutil.move(str(f), str(temp_path))
        temp_map[f.name] = temp_path

    # Renombrar desde temp al nombre final según clasificación
    counts: Dict[str, int] = {}
    new_classification: Dict[str, str] = {}
    for original_name, category in classification.items():
        temp_path = temp_map.get(original_name)
        if not temp_path or not temp_path.exists():
            continue
        counts[category] = counts.get(category, 0) + 1
        new_name = f"{category}_{counts[category]:02d}{temp_path.suffix}"
        shutil.move(str(temp_path), str(img_dir / new_name))
        new_classification[new_name] = category

    # Si quedó alguna imagen sin clasificar, moverla como 99_otros
    for original_name, temp_path in temp_map.items():
        if not temp_path.exists():
            continue
        counts["99_otros"] = counts.get("99_otros", 0) + 1
        new_name = f"99_otros_{counts['99_otros']:02d}{temp_path.suffix}"
        shutil.move(str(temp_path), str(img_dir / new_name))
        new_classification[new_name] = "99_otros"

    # Limpiar temp vacío
    if temp_dir.exists() and not any(temp_dir.iterdir()):
        temp_dir.rmdir()

    # Guardar classification.json con los nombres nuevos para consistencia
    save_classification(img_dir, new_classification)


def repair_classification(prop_dir: Path) -> Dict[str, str]:
    """Reconstruye classification.json a partir de los nombres de archivo actuales."""
    img_dir = prop_dir / "Imagenes"
    if not img_dir.exists():
        return {}

    images = [f for f in sorted(img_dir.iterdir()) if f.is_file() and f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")]
    classification: Dict[str, str] = {}
    for img in images:
        category = _extract_category_from_filename(img.name) or "99_otros"
        classification[img.name] = category
        print(f"  {prop_dir.name}/{img.name} -> {category} ({CATEGORY_BY_CODE.get(category, ('', 'Otros', ''))[1]})")
    save_classification(img_dir, classification)
    return classification


def classify_property(client: OpenAI, prop_dir: Path, dry_run: bool = False) -> Dict[str, str]:
    img_dir = prop_dir / "Imagenes"
    if not img_dir.exists():
        return {}

    classification = load_classification(img_dir)
    images = [f for f in sorted(img_dir.iterdir()) if f.is_file() and f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")]

    for img in images:
        if img.name in classification:
            continue
        category = classify_image(client, img)
        classification[img.name] = category
        print(f"  {prop_dir.name}/{img.name} -> {category} ({CATEGORY_BY_CODE[category][1]})")
        if not dry_run:
            save_classification(img_dir, classification)

    if not dry_run:
        rename_images(img_dir, classification)

    return classification


def main(dry_run: bool = False, only_property: str = None, repair: bool = False) -> None:
    if repair:
        processed = 0
        for prop_dir in sorted(BASE_DIR.iterdir()):
            if not prop_dir.is_dir() or prop_dir.name in ("web-propiedades", "__pycache__", ".trae"):
                continue
            if only_property and prop_dir.name != only_property:
                continue
            img_dir = prop_dir / "Imagenes"
            if not img_dir.exists():
                continue
            images = [f for f in img_dir.iterdir() if f.is_file() and f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")]
            if not images:
                continue
            print(f"\nReparando {prop_dir.name} ({len(images)} imágenes)...")
            repair_classification(prop_dir)
            processed += len(images)
        print(f"\nTotal imágenes reparadas: {processed}")
        return

    client = get_client()
    processed = 0
    total_cost_estimate = 0.0

    for prop_dir in sorted(BASE_DIR.iterdir()):
        if not prop_dir.is_dir() or prop_dir.name in ("web-propiedades", "__pycache__", ".trae"):
            continue
        if only_property and prop_dir.name != only_property:
            continue
        img_dir = prop_dir / "Imagenes"
        if not img_dir.exists():
            continue

        images = [f for f in img_dir.iterdir() if f.is_file() and f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")]
        if not images:
            continue

        print(f"\nProcesando {prop_dir.name} ({len(images)} imágenes)...")
        classify_property(client, prop_dir, dry_run=dry_run)
        processed += len(images)
        total_cost_estimate += len(images) * 0.005  # GPT-4o-mini vision ~$0.005 por imagen aprox

    print(f"\nTotal imágenes procesadas: {processed}")
    print(f"Costo estimado aproximado: ${total_cost_estimate:.2f} USD")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Clasifica imágenes de propiedades por categoría")
    parser.add_argument("--dry-run", action="store_true", help="Clasifica sin renombrar archivos")
    parser.add_argument("--only", type=str, help="Procesar solo una propiedad (nombre de carpeta)")
    parser.add_argument("--repair", action="store_true", help="Reconstruye classification.json desde los nombres de archivo actuales (sin API)")
    args = parser.parse_args()
    main(dry_run=args.dry_run, only_property=args.only, repair=args.repair)
