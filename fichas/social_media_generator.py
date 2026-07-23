"""Generador de paquetes para publicaciones en Facebook.

Opción B: no genera un collage único, sino un set de imágenes individuales
optimizado para subir manualmente a grupos de Facebook. Facebook arma la grilla
y cada foto puede abrirse en grande.

Salida por propiedad:
  fichas/<propiedad>/social/facebook_post/
  ├── 01_portada_facebook.jpg
  ├── 02_foto_01.jpg
  ├── 03_foto_02.jpg
  ├── ...
  └── texto_facebook.txt

También genera:
  fichas/<propiedad>/social/facebook_post.zip
"""

from __future__ import annotations

import json
import re
import shutil
import zipfile
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

BRAND_BG = (24, 24, 27)
ACCENT = (245, 158, 11)
TEXT_LIGHT = (255, 255, 255)
TEXT_MUTED = (220, 220, 225)
COVER_SIZE = (1200, 630)
POST_IMAGE_SIZE = (1600, 1200)
MAX_FACEBOOK_PHOTOS = 12


def _safe_text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def _load_font(size: int, bold: bool = False):
    candidates = []
    if bold:
        candidates += [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
        ]
    candidates += [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            pass
    return ImageFont.load_default()


def _wrap_text(text: str, font, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        if font.getbbox(test)[2] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [text]


def _crop_cover(photo: Image.Image, size: tuple[int, int]) -> Image.Image:
    photo = photo.convert("RGB")
    target_ratio = size[0] / size[1]
    src_ratio = photo.width / photo.height
    if src_ratio > target_ratio:
        new_width = int(photo.height * target_ratio)
        left = (photo.width - new_width) // 2
        photo = photo.crop((left, 0, left + new_width, photo.height))
    else:
        new_height = int(photo.width / target_ratio)
        top = (photo.height - new_height) // 2
        photo = photo.crop((0, top, photo.width, top + new_height))
    return photo.resize(size, Image.Resampling.LANCZOS)


def _fit_inside(photo: Image.Image, size: tuple[int, int]) -> Image.Image:
    photo = photo.convert("RGB")
    photo.thumbnail(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", size, (12, 12, 14))
    x = (size[0] - photo.width) // 2
    y = (size[1] - photo.height) // 2
    canvas.paste(photo, (x, y))
    return canvas


def _resolve_image_paths(property_data: dict[str, Any], public_dir: Path) -> list[Path]:
    paths: list[Path] = []
    for image_url in property_data.get("images", []) or []:
        if not image_url or not isinstance(image_url, str):
            continue
        relative = image_url.lstrip("/")
        candidate = public_dir / relative
        if candidate.exists() and candidate.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
            if candidate not in paths:
                paths.append(candidate)
    return paths


def generate_facebook_text(property_data: dict[str, Any]) -> str:
    title = _safe_text(property_data.get("title") or property_data.get("address"))
    address = _safe_text(property_data.get("address"))
    neighborhood = _safe_text(property_data.get("neighborhood"))
    operation = _safe_text(property_data.get("operation"))
    price = _safe_text(property_data.get("price"))
    expenses = _safe_text(property_data.get("expenses"))
    rooms = _safe_text(property_data.get("rooms"))
    total_area = _safe_text(property_data.get("total_area"))
    covered_area = _safe_text(property_data.get("covered_area"))
    whatsapp = _safe_text(property_data.get("whatsapp", "+541167589092"))
    prop_id = _safe_text(property_data.get("id"))

    features = []
    if rooms:
        features.append(f"{rooms} ambientes")
    if total_area:
        features.append(f"{total_area} m² totales")
    if covered_area:
        features.append(f"{covered_area} m² cubiertos")

    lines = [
        f"{title}",
        "",
        f"{operation}: {price}".strip(),
    ]
    if expenses:
        lines.append(f"Expensas: {expenses}")
    if features:
        lines.append(" · ".join(features))
    if address or neighborhood:
        lines.append(" - ".join(x for x in [address, neighborhood] if x))
    lines += [
        "",
        "Consultanos para más información o para coordinar una visita.",
        f"WhatsApp: {whatsapp}",
        f"Ver propiedad: https://quintana.cabapropiedades.ar/property/{prop_id}",
        "",
        "Quintana Servicios Inmobiliarios",
    ]
    return "\n".join(lines)


def generate_facebook_cover(property_data: dict[str, Any], photo_path: Path | None, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if photo_path and photo_path.exists():
        img = _crop_cover(Image.open(photo_path), COVER_SIZE)
    else:
        img = Image.new("RGB", COVER_SIZE, BRAND_BG)

    overlay = Image.new("RGBA", COVER_SIZE, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle([0, 0, 520, COVER_SIZE[1]], fill=(0, 0, 0, 185))
    od.rectangle([0, COVER_SIZE[1] - 96, COVER_SIZE[0], COVER_SIZE[1]], fill=(0, 0, 0, 145))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    title_font = _load_font(46, True)
    price_font = _load_font(54, True)
    detail_font = _load_font(28)
    brand_font = _load_font(24, True)

    title = _safe_text(property_data.get("title") or property_data.get("address"))
    y = 54
    for line in _wrap_text(title, title_font, 430)[:3]:
        draw.text((42, y), line, fill=TEXT_LIGHT, font=title_font)
        y += 56

    operation = _safe_text(property_data.get("operation"))
    price = _safe_text(property_data.get("price"))
    draw.text((42, 300), f"{operation}: {price}".strip(), fill=ACCENT, font=price_font)

    details = []
    if property_data.get("neighborhood"):
        details.append(_safe_text(property_data["neighborhood"]))
    if property_data.get("rooms"):
        details.append(f"{_safe_text(property_data['rooms'])} amb.")
    if property_data.get("total_area"):
        details.append(f"{_safe_text(property_data['total_area'])} m²")
    draw.text((42, 384), " · ".join(details), fill=TEXT_MUTED, font=detail_font)

    draw.rectangle([0, COVER_SIZE[1] - 8, COVER_SIZE[0], COVER_SIZE[1]], fill=ACCENT)
    draw.text((42, COVER_SIZE[1] - 64), "QUINTANA SERVICIOS INMOBILIARIOS", fill=TEXT_LIGHT, font=brand_font)
    draw.text((790, COVER_SIZE[1] - 64), "quintana.cabapropiedades.ar", fill=TEXT_MUTED, font=brand_font)
    img.save(output_path, "JPEG", quality=94)


def generate_facebook_package(
    property_data: dict[str, Any],
    output_dir: Path,
    public_dir: Path,
    max_photos: int = MAX_FACEBOOK_PHOTOS,
) -> dict[str, Path]:
    facebook_dir = output_dir / "facebook_post"
    if facebook_dir.exists():
        shutil.rmtree(facebook_dir)
    facebook_dir.mkdir(parents=True, exist_ok=True)

    image_paths = _resolve_image_paths(property_data, public_dir)
    cover_path = facebook_dir / "01_portada_facebook.jpg"
    generate_facebook_cover(property_data, image_paths[0] if image_paths else None, cover_path)

    for idx, image_path in enumerate(image_paths[:max_photos], start=2):
        try:
            optimized = _fit_inside(Image.open(image_path), POST_IMAGE_SIZE)
            optimized.save(facebook_dir / f"{idx:02d}_foto_{idx-1:02d}.jpg", "JPEG", quality=92)
        except Exception:
            continue

    text_path = facebook_dir / "texto_facebook.txt"
    text_path.write_text(generate_facebook_text(property_data), encoding="utf-8")

    zip_path = output_dir / "facebook_post.zip"
    output_dir.mkdir(parents=True, exist_ok=True)
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for file_path in sorted(facebook_dir.iterdir()):
            zf.write(file_path, arcname=file_path.name)

    return {"output_dir": facebook_dir, "zip": zip_path, "text": text_path, "cover": cover_path}


def generate_for_property_id(prop_id: str) -> dict[str, Path]:
    fichas_dir = Path(__file__).parent
    properties_json = fichas_dir / "web-propiedades" / "src" / "data" / "properties.json"
    data = json.loads(properties_json.read_text(encoding="utf-8"))
    config = data.get("config", {})
    prop = next((p for p in data.get("properties", []) if p.get("id") == prop_id), None)
    if not prop:
        raise ValueError(f"No existe propiedad en properties.json: {prop_id}")
    enriched = {**prop, **{k: v for k, v in config.items() if k not in prop}}
    public_dir = fichas_dir / "web-propiedades" / "public"
    return generate_facebook_package(enriched, fichas_dir / prop_id / "social", public_dir)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Genera paquete Facebook para una propiedad")
    parser.add_argument("property_id", help="ID de propiedad, ejemplo: Yerbal_2600")
    args = parser.parse_args()
    result = generate_for_property_id(args.property_id)
    print(f"ZIP generado: {result['zip']}")
