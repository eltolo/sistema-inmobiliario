import re
from pathlib import Path

BASE = Path(__file__).parent.parent / "fichas"

for carpeta in sorted(BASE.iterdir()):
    if not carpeta.is_dir() or carpeta.name in ("web-propiedades", ".trae"):
        continue
    page = carpeta / "page.html"
    if not page.exists():
        continue
    html = page.read_text(encoding="utf-8", errors="ignore")
    urls = re.findall(r'https://imgar\.zonapropcdn\.com/avisos/[^"\'\\ >]+\.jpg', html)
    if urls:
        seqs = set()
        for u in urls:
            m = re.search(r'/(\d+)\.jpg', u)
            if m:
                seqs.add(m.group(1))
        pairs = None
        for u in urls:
            m = re.search(r'/avisos/\w*/?\d+/(\d+/\d+/\d+/\d+/\d+)/', u)
            if m:
                pairs = m.group(1)
                break
        prop_id = pairs.replace("/", "") if pairs else "?"
        print(f"{carpeta.name}: prop_id={prop_id} seqs={sorted(seqs, key=int)[:5]}")
