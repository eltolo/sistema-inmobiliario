import re
import time
import random
import requests
from pathlib import Path

BASE = Path(__file__).parent.parent / "fichas"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://www.zonaprop.com.ar/",
}


def url_to_hd_pairs_seq(url):
    """Return (pairs, seq) from any zonaprop image URL, or None."""
    # Format with pairs already: /avisos/1/00/58/48/15/79/720x532/2036102159.jpg
    m = re.search(r'/avisos/(?:\w+/)?\d+/(\d+/\d+/\d+/\d+/\d+)/(?:\d+x\d+)/(\d+)\.jpg', url)
    if m:
        return m.group(1), int(m.group(2))
    # Format without pairs: /avisos/1/00/58708332/1200x1200/2042378161.jpg
    m = re.search(r'/avisos/(?:\w+/)?\d+/(\d+)/(?:\d+x\d+)/(\d+)\.jpg', url)
    if m:
        prop_id = m.group(1)
        padded = prop_id.zfill(10)
        pairs = "/".join(padded[i:i+2] for i in range(0, 10, 2))
        return pairs, int(m.group(2))
    return None


for carpeta in sorted(BASE.iterdir()):
    if not carpeta.is_dir() or carpeta.name in ("web-propiedades", ".trae"):
        continue

    img_dir = carpeta / "Imagenes"
    img_dir.mkdir(exist_ok=True)
    existentes = len(list(img_dir.glob("*.jpg")))

    page_html = carpeta / "page.html"
    seq_encontrados = set()
    pairs = None

    if page_html.exists():
        html = page_html.read_text(encoding="utf-8", errors="ignore")
        # Find all zonaprop image URLs
        urls = re.findall(r'https://imgar\.zonapropcdn\.com/avisos/[^"\'\\ >]+\.jpg', html)
        for u in urls:
            result = url_to_hd_pairs_seq(u)
            if result:
                p, s = result
                pairs = p  # use the last found pairs
                seq_encontrados.add(s)

    if not pairs:
        raw_file = carpeta / "datos_raw.txt"
        if raw_file.exists():
            for line in raw_file.read_text(encoding="utf-8").splitlines():
                m = re.search(r"-(\d+)\.html", line)
                if m:
                    prop_id = m.group(1)
                    padded = prop_id.zfill(10)
                    pairs = "/".join(padded[i:i+2] for i in range(0, 10, 2))
                    break

    if not pairs:
        print(f"{carpeta.name}: no se pudo determinar pairs")
        continue

    print(f"{carpeta.name}: pairs={pairs} existentes={existentes} seqs={sorted(seq_encontrados)[:5]}", end="")

    descargadas = 0
    probadas = set()

    # Generate all candidate sequences: found seqs + probe around them
    all_seqs = set(seq_encontrados)
    for bs in seq_encontrados:
        for off in range(1, 60):
            all_seqs.add(bs + off)
            all_seqs.add(bs - off)

    for seq in sorted(all_seqs):
        if seq <= 0 or descargadas >= 25:
            continue
        hd_url = f"https://imgar.zonapropcdn.com/avisos/resize/1/{pairs}/1200x1200/{seq}.jpg"
        if hd_url in probadas:
            continue
        probadas.add(hd_url)
        try:
            time.sleep(random.uniform(0.15, 0.3))
            resp = requests.get(hd_url, headers=headers, timeout=10)
            if resp.status_code == 200 and len(resp.content) > 51200:
                idx = existentes + descargadas + 1
                nombre = f"foto_{idx:02d}.jpg"
                ruta = img_dir / nombre
                with open(ruta, "wb") as f:
                    f.write(resp.content)
                descargadas += 1
                print(f" +HD({seq})", end="")
        except Exception:
            continue

    print(f" -> total: {existentes + descargadas}")
