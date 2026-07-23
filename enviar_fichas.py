import os
import re
import sys
from pathlib import Path


MCP_PATH = Path(os.getenv("MCP_GMAIL_PATH", "D:\\Apps\\MCP_GMAIL"))
FICHAS_DIR = Path(__file__).parent / "fichas"

TO_OK = "claudiadlf@gmail.com"
TO_FAIL = "tolosa.jorge@gmail.com"
THRESHOLD = 80.0


def cargar_gmail_service():
    if not MCP_PATH.exists():
        raise FileNotFoundError(f"MCP_GMAIL no existe en {MCP_PATH}")
    sys.path.append(str(MCP_PATH))
    os.chdir(MCP_PATH)
    from mcp_gmail.gmail_service import GmailService
    return GmailService()


def obtener_completitud(carpeta: Path) -> float:
    diag = carpeta / "diagnostico.txt"
    if not diag.exists():
        return 0.0
    text = diag.read_text(encoding="utf-8", errors="ignore")
    match = re.search(r"Completitud:\s*([0-9.]+)%", text)
    if not match:
        return 0.0
    return float(match.group(1))


def obtener_asunto(carpeta: Path) -> str:
    desc = carpeta / "descripcion.txt"
    if desc.exists():
        for line in desc.read_text(encoding="utf-8", errors="ignore").splitlines():
            if line.strip():
                return line.strip()
    return carpeta.name.replace("_", " ")


def obtener_docx(carpeta: Path) -> Path | None:
    files = list(carpeta.glob("*.docx"))
    return files[0] if files else None


def main():
    if not FICHAS_DIR.exists():
        print("No existe la carpeta fichas/")
        return
    gmail = cargar_gmail_service()

    for carpeta in sorted(FICHAS_DIR.iterdir()):
        if not carpeta.is_dir():
            continue
        docx = obtener_docx(carpeta)
        if not docx:
            continue
        completitud = obtener_completitud(carpeta)
        subject = obtener_asunto(carpeta)
        to = TO_OK if completitud >= THRESHOLD else TO_FAIL
        body = (
            f"Adjunto ficha {subject}.\n"
            f"Completitud: {completitud:.1f}%\n"
        )
        gmail.send_email(to, subject, body, attachments=[str(docx)])
        print(f"Enviado: {subject} -> {to} ({completitud:.1f}%)")


if __name__ == "__main__":
    main()
