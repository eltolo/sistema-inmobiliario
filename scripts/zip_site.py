import zipfile
import os
import time
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(__file__).resolve().parent.parent
base = PROJECT_ROOT / 'fichas' / 'web-propiedades'
fichas_base = PROJECT_ROOT / 'fichas'
zip_path = PROJECT_ROOT / 'site_express.zip'
exclude = {'node_modules', '.git', '.vscode', 'src', 'scripts'}
fichas_exclude = {'web-propiedades', 'node_modules', '.git', '.vscode', '__pycache__', '.trae'}
RESERVED_NAMES = {'CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'}
SAFE_DATE = (2020, 1, 1, 0, 0, 0)

def is_reserved_name(path: Path) -> bool:
    return path.name.upper() in RESERVED_NAMES or path.stem.upper() in RESERVED_NAMES

def add_dir_to_zip(zf: zipfile.ZipFile, source: Path, zip_prefix: str, dir_exclude: set) -> None:
    for root, dirs, files in os.walk(source):
        dirs[:] = [d for d in dirs if d not in dir_exclude]
        for file in files:
            file_path = Path(root) / file
            rel = file_path.relative_to(source)
            zip_name = f'{zip_prefix}/{rel}' if zip_prefix else str(rel)
            if is_reserved_name(file_path):
                continue
            try:
                zf.write(file_path, zip_name)
            except ValueError as e:
                if 'timestamps before 1980' in str(e):
                    with open(file_path, 'rb') as f:
                        data = f.read()
                    zinfo = zipfile.ZipInfo(filename=zip_name, date_time=SAFE_DATE)
                    zf.writestr(zinfo, data)
                else:
                    raise

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    add_dir_to_zip(zf, base, '', exclude)
    add_dir_to_zip(zf, fichas_base, 'fichas', fichas_exclude)

print(f'OK: {zip_path.name} ({zip_path.stat().st_size:,} bytes)')
