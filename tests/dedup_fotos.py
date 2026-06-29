import hashlib
import json
import re
import shutil
import tempfile
from pathlib import Path
from collections import defaultdict

BASE = Path(__file__).parent.parent / "fichas"
CATEGORY_RE = re.compile(r"^(\d{2}_[a-z_]+)_\d+\.")

def has_category_prefix(name: str) -> bool:
    return bool(CATEGORY_RE.match(name.lower()))


def extract_category(name: str) -> str | None:
    m = CATEGORY_RE.match(name.lower())
    return m.group(1) if m else None


for carpeta in sorted(BASE.iterdir()):
    if not carpeta.is_dir() or carpeta.name in ("web-propiedades", ".trae"):
        continue
    img_dir = carpeta / "Imagenes"
    if not img_dir.exists():
        continue

    todos = list(img_dir.iterdir())
    if not todos:
        continue

    # Remove optimized thumbnails (smaller versions from web build)
    for f in list(img_dir.glob("*optimized*")):
        f.unlink()

    # Group remaining by MD5 hash
    hashes = defaultdict(list)
    for f in img_dir.iterdir():
        if f.is_file():
            h = hashlib.md5(f.read_bytes()).hexdigest()
            hashes[h].append(f)

    total_antes = sum(len(v) for v in hashes.values())
    all_files = []
    for h, archivos in hashes.items():
        all_files.append(archivos[0])
        for f in archivos[1:]:
            f.unlink()

    # Sort by name for consistent ordering
    all_files.sort(key=lambda f: f.name.lower())
    tmp = Path(tempfile.mkdtemp())

    # Si todas las imágenes ya tienen prefijo de categoría, se conserva y se renumeran
    # por categoría. Si no, se vuelve al esquema foto_XX.jpg para poder clasificar después.
    if all_files and all(has_category_prefix(f.name) for f in all_files):
        counts: dict[str, int] = {}
        new_classification: dict[str, str] = {}
        for f in all_files:
            cat = extract_category(f.name)
            counts[cat] = counts.get(cat, 0) + 1
            new_name = f"{cat}_{counts[cat]:02d}{f.suffix}"
            shutil.copy2(f, tmp / new_name)
            new_classification[new_name] = cat
        # Actualizar classification.json con los nombres nuevos
        classification_file = img_dir / "classification.json"
        classification_file.write_text(json.dumps(new_classification, indent=2, ensure_ascii=False), encoding="utf-8")
    else:
        for i, f in enumerate(all_files, 1):
            shutil.copy2(f, tmp / f"foto_{i:02d}.jpg")
        # Si existe classification.json queda desactualizado; lo eliminamos para evitar inconsistencias
        classification_file = img_dir / "classification.json"
        if classification_file.exists():
            classification_file.unlink()

    # Replace originals
    for f in img_dir.glob("*.*"):
        if f.is_file():
            f.unlink()
    for f in tmp.iterdir():
        shutil.copy2(f, img_dir / f.name)
    shutil.rmtree(tmp)

    final = len(list(img_dir.iterdir()))
    if total_antes != final:
        print(f"{carpeta.name}: {total_antes} -> {final} fotos")
