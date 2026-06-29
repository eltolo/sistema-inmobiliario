import os
import sys
import re
import json
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
load_dotenv(BASE_DIR / '.env')
FICHAS_DIR = Path(__file__).parent

api_key = os.environ.get('OPENAI_API_KEY')
if not api_key:
    print("Error: OPENAI_API_KEY no encontrada en .env")
    exit(1)

client = OpenAI(api_key=api_key)
OPENAI_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')

REWRITE_PROMPT = """
Eres un redactor experto en real estate para "Quintana Servicios Inmobiliarios", una inmobiliaria boutique de Capital Federal.

Tu tarea es reescribir la SECCIÓN DE DESCRIPCIÓN de una propiedad con tono profesional, elegante y persuasivo.

REGLAS ESTRICTAS:
1. Escribí en minúsculas con mayúscula inicial en cada oración y nombres propios
2. Estructurá en 2-3 párrafos cortos sin bullet points, que fluyan naturalmente
3. NO inventes datos que no estén en el original
4. Eliminá frases genéricas de portales como "consúltenos", "ver datos", "cel.", "no se aceptan mascotas"
5. Si hay información de ubicación (calles, subtes, referencias), mejorá su redacción
6. Agregá un CTA al final variado y profesional
7. Respondé SOLO con el texto corregido, sin introducciones ni explicaciones
8. Si el texto está vacío o es muy corto, respondé exactamente: "NO_DATA"

TEXTO ORIGINAL:
{text}

TEXTO CORREGIDO:
"""

INFERENCE_PROMPT = """
Actuá como un extractor de datos inmobiliarios. Del siguiente texto de descripción de propiedad, extraé SOLO los campos que puedas inferir con certeza.

Campos posibles: ambientes, dormitorios, banos, antiguedad, orientacion, ubicacion (frente/contrafrente), mascotas (Si/No), apto_credito (Si/No), metros_totales, metros_cubiertos, piso.

Formato de respuesta: cada campo en una línea como "campo: valor". Si no hay datos suficientes, respondé exactamente "NO_DATA".

TEXTO:
{text}

CAMPOS INFERIDOS:
"""

NORMALIZACIONES = [
    (r'\bmts2\b', 'm²'),
    (r'\bmts\s*2\b', 'm²'),
    (r'\bm2\b', 'm²'),
    (r'\bsup2\b', '²'),
    (r'\bU\$S\b', 'USD'),
    (r'\bU$S\b', 'USD'),
]


def normalize_units(text):
    if not text:
        return ""
    result = text
    for pattern, replacement in NORMALIZACIONES:
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    return result


def parse_descripcion_file(desc_path):
    if not desc_path.exists():
        return None
    contenido = desc_path.read_text(encoding='utf-8')

    header_lines = []
    caracteristicas = ""
    in_caracteristicas = False
    lines = contenido.splitlines()

    for line in lines:
        stripped = line.strip()
        if re.search(r'características?:|caracteristicas?:', stripped, re.IGNORECASE):
            in_caracteristicas = True
            continue
        if in_caracteristicas:
            if caracteristicas:
                caracteristicas += "\n"
            caracteristicas += line
        else:
            header_lines.append(line)

    if not in_caracteristicas:
        caracteristicas = contenido.strip()

    return {
        "header_lines": header_lines,
        "caracteristicas": caracteristicas.strip(),
        "raw": contenido,
    }


def reconstruct_descripcion_file(parsed, rewritten):
    filtered = [l for l in parsed["header_lines"] if "AUTO_GENERATED" not in l and "AUTO_GENERADO" not in l]
    header = "\n".join(filtered)
    block = header
    if block and not block.endswith("\n"):
        block += "\n"
    block += "\ncaracterísticas:\n"
    block += rewritten.strip()
    block += "\n"
    return block


def rewrite_text(text):
    if not text or len(text.strip()) < 10:
        return None
    prompt = REWRITE_PROMPT.format(text=text)
    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1000,
        )
        result = response.choices[0].message.content.strip()
        if result == "NO_DATA":
            return None
        return result
    except Exception as e:
        print(f"  Error con OpenAI: {e}")
        return None


def _parse_inference_response(response_text):
    if not response_text or response_text.strip() == "NO_DATA":
        return {}
    fields = {}
    for line in response_text.strip().splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            key = key.strip().lower().replace(" ", "_")
            value = value.strip()
            if value and value.lower() not in ("ninguno", "n/a", "no_data"):
                fields[key] = value
    return fields


def infer_missing_fields(description_text, existing_data):
    if not description_text or len(description_text.strip()) < 10:
        return {}
    prompt = INFERENCE_PROMPT.format(text=description_text)
    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=300,
        )
        result = response.choices[0].message.content.strip()
        inferred = _parse_inference_response(result)
        only_new = {}
        for k, v in inferred.items():
            if k in existing_data and existing_data[k]:
                continue
            only_new[k] = v
        return only_new
    except Exception as e:
        print(f"  Error infiriendo campos: {e}")
        return {}


def rewrite_property(folder_name):
    folder = FICHAS_DIR / folder_name
    if not folder.is_dir():
        print(f"Error: no existe la carpeta '{folder_name}'")
        return False

    desc_file = folder / "descripcion.txt"
    if not desc_file.exists():
        print(f"  Saltando {folder_name}: no tiene descripcion.txt")
        return False

    print(f"  Leyendo descripción de {folder_name}...")
    parsed = parse_descripcion_file(desc_file)
    if not parsed:
        print(f"  Error al parsear descripcion.txt")
        return False

    original_raw = parsed["raw"]

    existing_data = {}
    raw_file = folder / "datos_raw.txt"
    if raw_file.exists():
        for line in raw_file.read_text(encoding='utf-8').splitlines():
            if ':' in line:
                k, v = line.split(':', 1)
                existing_data[k.strip().lower()] = v.strip()

    print(f"  Normalizando unidades...")
    normalized = normalize_units(parsed["caracteristicas"])

    print(f"  Reescribiendo con OpenAI...")
    rewritten = rewrite_text(normalized)
    if not rewritten:
        print(f"  Saltando {folder_name}: no se pudo reescribir")
        return False

    print(f"  Infiriendo campos faltantes desde descripción...")
    inferred = infer_missing_fields(normalized, existing_data)
    if inferred:
        print(f"  Campos inferidos: {inferred}")
        _update_datos_raw(raw_file, inferred)

    new_content = reconstruct_descripcion_file(parsed, rewritten)
    desc_file.write_text(new_content, encoding='utf-8')
    print(f"  Descripción actualizada OK")
    return True


def _update_datos_raw(raw_file, fields):
    if not fields:
        return
    if not raw_file.exists():
        return
    lines = raw_file.read_text(encoding='utf-8').splitlines()
    existing_keys = {}
    for i, line in enumerate(lines):
        if ':' in line:
            k = line.split(':', 1)[0].strip().lower()
            existing_keys[k] = i

    for key, value in fields.items():
        if key in existing_keys:
            idx = existing_keys[key]
            lines[idx] = f"{key}: {value}"
        else:
            lines.append(f"{key}: {value}")

    raw_file.write_text("\n".join(lines), encoding='utf-8')


def process_all():
    folders = [d for d in FICHAS_DIR.iterdir() if d.is_dir() and d.name != "web-propiedades" and not d.name.startswith('.')]
    folders.sort()
    ok = 0
    fail = 0
    for folder in folders:
        if rewrite_property(folder.name):
            ok += 1
        else:
            fail += 1
    print(f"\nProcesadas: {ok} correctas, {fail} omitidas/fallidas")
    if ok > 0:
        print("Ejecutá update_web.py para ver los cambios en la web.")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        rewrite_property(sys.argv[1])
    else:
        process_all()
