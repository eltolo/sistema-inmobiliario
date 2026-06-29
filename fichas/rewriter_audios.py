import os
import sys
import json
import requests
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
load_dotenv(BASE_DIR / '.env')
load_dotenv(Path(__file__).parent / '.env')
FICHAS_DIR = Path(__file__).parent

openai_key = os.environ.get('OPENAI_API_KEY')
elevenlabs_key = os.environ.get('ELEVENLABS_API_KEY')

if not openai_key:
    print("Error: OPENAI_API_KEY no encontrada")
    exit(1)
if not elevenlabs_key:
    print("Error: ELEVENLABS_API_KEY no encontrada en fichas/.env")
    exit(1)

llm = OpenAI(api_key=openai_key)
OPENAI_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')

ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"
ELEVENLABS_MODEL = "eleven_multilingual_v2"
ELEVENLABS_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"

CTA_EXAMPLES = [
    "No dude en contactarnos para coordinar una visita.",
    "Consúltenos para más información o para agendar un recorrido.",
    "Una propiedad única que merece ser visitada. Lo esperamos.",
    "Agende su visita hoy mismo y descubra todo lo que esta propiedad tiene para ofrecer.",
    "No deje pasar esta oportunidad. Contáctenos para más detalles.",
    "El lugar ideal lo espera. Coordine su visita ahora.",
    "Lo invitamos a conocer esta propiedad en persona. Contáctenos.",
    "Separe su turno hoy y viva la experiencia de su nuevo hogar.",
]

NARRATION_PROMPT = """
Eres un narrador inmobiliario profesional para "Quintana Servicios Inmobiliarios".
Generá un guión de audio corto y persuasivo (máximo 120 palabras) basado exclusivamente en la descripción de la propiedad.

El guión debe:
1. Ser conversacional y natural (como si un agente hablara al oído)
2. Mencionar: dirección, tipo de propiedad, ambientes, metros, y 2-3 características destacadas
3. NO leer características técnicas como lista
4. Terminar con un CTA breve y variado invitando a contactar o visitar
5. Estar en español argentino neutro
6. Respondé SOLO con el guión, sin introducciones ni etiquetas

DESCRIPCIÓN DE LA PROPIEDAD:
{text}

GUIÓN DE AUDIO:
"""


def generate_narration_script(description_text):
    if not description_text or len(description_text.strip()) < 10:
        return None
    try:
        response = llm.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": NARRATION_PROMPT.format(text=description_text)}],
            temperature=0.4,
            max_tokens=300,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"  Error generando guión: {e}")
        return None


def generate_audio_elevenlabs(text, output_path):
    try:
        resp = requests.post(
            ELEVENLABS_URL,
            headers={
                "xi-api-key": elevenlabs_key,
                "Content-Type": "application/json",
            },
            json={
                "text": text,
                "model_id": ELEVENLABS_MODEL,
                "voice_settings": {
                    "stability": 0.4,
                    "similarity_boost": 0.6,
                },
            },
            timeout=60,
        )
        if resp.status_code != 200:
            print(f"  ElevenLabs error {resp.status_code}: {resp.text[:200]}")
            return False
        with open(output_path, "wb") as f:
            f.write(resp.content)
        return True
    except Exception as e:
        print(f"  Error generando audio ElevenLabs: {e}")
        return False


def process_property(folder_name):
    folder = FICHAS_DIR / folder_name
    if not folder.is_dir():
        print(f"Error: no existe la carpeta '{folder_name}'")
        return False

    desc_file = folder / "descripcion.txt"
    if not desc_file.exists():
        print(f"  Saltando {folder_name}: no tiene descripcion.txt")
        return False

    print(f"  Leyendo descripción de {folder_name}...")

    from fichas.rewriter_descripciones import parse_descripcion_file
    parsed = parse_descripcion_file(desc_file)
    if parsed and parsed["caracteristicas"]:
        description = parsed["caracteristicas"]
    else:
        description = desc_file.read_text(encoding='utf-8')

    print(f"  Generando guión de narración con OpenAI...")
    script = generate_narration_script(description)
    if not script:
        print(f"  Saltando {folder_name}: no se pudo generar guión")
        return False

    audio_dir = folder / "tts_segments"
    audio_dir.mkdir(exist_ok=True)
    output_file = audio_dir / "narracion_actualizada.wav"

    print(f"  Generando audio con ElevenLabs...")
    ok = generate_audio_elevenlabs(script, output_file)
    if ok:
        print(f"  Audio guardado: {output_file} OK")
        return True
    else:
        print(f"  Error generando audio para {folder_name}")
        return False


def process_all():
    folders = [d for d in FICHAS_DIR.iterdir() if d.is_dir() and d.name != "web-propiedades" and not d.name.startswith('.')]
    folders.sort()
    ok = 0
    fail = 0
    for folder in folders:
        if process_property(folder.name):
            ok += 1
        else:
            fail += 1
    print(f"\nAudios generados: {ok} correctos, {fail} omitidos/fallidos")
    if ok > 0:
        print("Ejecutá update_web.py para sincronizar los nuevos audios con la web.")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        process_property(sys.argv[1])
    else:
        process_all()
