"""Generador de contenido para Instagram.

Crea para cada propiedad:
- una tarjeta visual 1080x1080 lista para subir (card.jpg)
- un caption optimizado con hashtags y CTA (caption.txt)

Los archivos se guardan en la carpeta de la propiedad bajo `instagram/` y
luego se exponen en la web via `update_web.py`.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        "Pillow es necesario. Instalalo con: pip install Pillow"
    ) from exc

# Configuración visual de la tarjeta
CARD_SIZE = (1080, 1080)
IMAGE_AREA = (0, 0, 1080, 720)  # y0, y1 para la foto principal
OVERLAY_HEIGHT = 360
BRAND_BG = (24, 24, 27)  # zinc-950
ACCENT = (245, 158, 11)  # amber-500
TEXT_LIGHT = (255, 255, 255)
TEXT_MUTED = (160, 160, 174)


def _load_font(size: int, prefer_bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Carga una fuente TrueType del sistema o devuelve la fuente por defecto."""
    candidates = []
    if prefer_bold:
        candidates.extend(
            [
                "C:/Windows/Fonts/arialbd.ttf",
                "C:/Windows/Fonts/ArialBold.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                "/System/Library/Fonts/Helvetica.ttc",
            ]
        )
    candidates.extend(
        [
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/Arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
        ]
    )
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    """Divide el texto en líneas que no excedan el ancho máximo."""
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        bbox = font.getbbox(test)
        if bbox and bbox[2] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [text]


def _safe_text(value: Any) -> str:
    """Convierte cualquier valor a texto legible."""
    if value is None:
        return ""
    text = str(value).strip()
    # Normalizar acentos y caracteres comunes para evitar errores de fuente
    return text


def generate_caption(property_data: dict[str, Any]) -> str:
    """Genera un caption de Instagram para una propiedad."""
    title = _safe_text(property_data.get("title", property_data.get("address", "")))
    address = _safe_text(property_data.get("address", ""))
    neighborhood = _safe_text(property_data.get("neighborhood", ""))
    price = _safe_text(property_data.get("price", ""))
    expenses = _safe_text(property_data.get("expenses", ""))
    prop_type = _safe_text(property_data.get("type", ""))
    operation = _safe_text(property_data.get("operation", "Venta"))
    total_area = _safe_text(property_data.get("total_area", ""))
    bedrooms = _safe_text(property_data.get("bedrooms", ""))
    bathrooms = _safe_text(property_data.get("bathrooms", ""))
    whatsapp = _safe_text(property_data.get("whatsapp", "+541167589092"))
    instagram = _safe_text(property_data.get("instagram", "")).replace("@", "")

    # Construir línea de características
    features = []
    if total_area:
        features.append(f"{total_area} m² totales")
    if bedrooms:
        features.append(f"{bedrooms} dorm." if int(bedrooms) > 1 else f"{bedrooms} dorm.")
    if bathrooms:
        features.append(f"{bathrooms} baños" if int(bathrooms) > 1 else f"{bathrooms} baño")

    features_line = " | ".join(features)

    lines = [
        f"{title}",
        "",
        f"{operation}: {price}" + (f" - Expensas: {expenses}" if expenses and expenses != "0" else ""),
    ]
    if features_line:
        lines.append(features_line)
    if address and neighborhood:
        lines.append(f"{address}, {neighborhood}")
    elif address:
        lines.append(address)

    lines.extend(
        [
            "",
            "¿Te interesa? Contactanos por WhatsApp o DM para más info y coordinar una visita.",
            f"📲 {whatsapp}",
            f"🌐 https://quintana.cabapropiedades.ar/property/{property_data.get('id', '')}",
            "",
            "#QuintanaInmobiliaria #Propiedades #Inmobiliaria #BuenosAires #RealEstate "
            f"#{neighborhood.replace(' ', '')} #{prop_type} #Venta #Alquiler",
        ]
    )
    if instagram:
        lines.append(f"@{instagram}")

    return "\n".join(lines)


def generate_card(property_data: dict[str, Any], output_path: Path) -> None:
    """Genera la tarjeta visual de Instagram y la guarda en output_path."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    img = Image.new("RGB", CARD_SIZE, BRAND_BG)
    draw = ImageDraw.Draw(img)

    # Foto principal
    images = property_data.get("images", [])
    photo_path: Path | None = None
    for candidate in images:
        if candidate and isinstance(candidate, str):
            # Asumimos paths absolutos desde la raíz del frontend; buscar en el projecto
            relative = candidate.lstrip("/")
            possible = Path(relative)
            if not possible.is_absolute():
                possible = Path(__file__).parent.parent / "fichas" / "web-propiedades" / "public" / relative
            if possible.exists():
                photo_path = possible
                break

    if photo_path and photo_path.exists():
        photo = Image.open(photo_path).convert("RGB")
        # Recortar al centro manteniendo aspecto 3:2 (1080x720)
        target_ratio = 1080 / 720
        src_ratio = photo.width / photo.height
        if src_ratio > target_ratio:
            new_width = int(photo.height * target_ratio)
            left = (photo.width - new_width) // 2
            photo = photo.crop((left, 0, left + new_width, photo.height))
        else:
            new_height = int(photo.width / target_ratio)
            top = (photo.height - new_height) // 2
            photo = photo.crop((0, top, photo.width, top + new_height))
        photo = photo.resize((1080, 720), Image.Resampling.LANCZOS)
        img.paste(photo, (0, 0))
        # Sutil degradado oscuro en la parte inferior de la foto para mejorar legibilidad del texto
        overlay = Image.new("RGBA", CARD_SIZE, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        for i in range(180):
            alpha = int(120 * (i / 180))
            overlay_draw.line([(0, 540 + i), (1080, 540 + i)], fill=(0, 0, 0, alpha))
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
        draw = ImageDraw.Draw(img)

    # Barra de info inferior
    draw.rectangle([0, 720, 1080, 1080], fill=BRAND_BG)
    # Línea de acento
    draw.rectangle([0, 720, 1080, 726], fill=ACCENT)

    title_font = _load_font(48, prefer_bold=True)
    detail_font = _load_font(32)
    price_font = _load_font(64, prefer_bold=True)
    brand_font = _load_font(24)

    title = _safe_text(property_data.get("title", property_data.get("address", "")))
    title_lines = _wrap_text(title, title_font, 1000)
    y = 760
    for line in title_lines[:2]:
        draw.text((40, y), line, fill=TEXT_LIGHT, font=title_font)
        y += 58

    price = f"{_safe_text(property_data.get('operation', 'Venta'))}: {_safe_text(property_data.get('price', ''))}"
    draw.text((40, 880), price, fill=ACCENT, font=price_font)

    details = []
    if property_data.get("neighborhood"):
        details.append(_safe_text(property_data["neighborhood"]))
    if property_data.get("total_area"):
        details.append(f"{_safe_text(property_data['total_area'])} m²")
    if property_data.get("bedrooms"):
        details.append(f"{_safe_text(property_data['bedrooms'])} dorm.")
    if property_data.get("bathrooms"):
        details.append(f"{_safe_text(property_data['bathrooms'])} baños")
    if details:
        draw.text((40, 960), " · ".join(details), fill=TEXT_MUTED, font=detail_font)

    # Branding
    brand_text = "QUINTANA SERVICIOS INMOBILIARIOS"
    draw.text((40, 1030), brand_text, fill=TEXT_MUTED, font=brand_font)
    draw.text((700, 1030), "https://quintana.cabapropiedades.ar", fill=TEXT_MUTED, font=brand_font)

    img.save(output_path, "JPEG", quality=95)


def generate_for_property(property_data: dict[str, Any], output_dir: Path) -> dict[str, Path]:
    """Genera tarjeta y caption para una propiedad y devuelve las rutas creadas."""
    output_dir.mkdir(parents=True, exist_ok=True)
    card_path = output_dir / "card.jpg"
    caption_path = output_dir / "caption.txt"

    generate_card(property_data, card_path)
    caption = generate_caption(property_data)
    caption_path.write_text(caption, encoding="utf-8")

    return {"card": card_path, "caption": caption_path}


def generate_all(properties_json_path: Path | None = None) -> list[dict[str, Any]]:
    """Genera contenido de Instagram para todas las propiedades del JSON.

    Los archivos se escriben dentro de cada carpeta de propiedad:
    fichas/<property_id>/instagram/.
    """
    if properties_json_path is None:
        properties_json_path = (
            Path(__file__).parent / "web-propiedades" / "src" / "data" / "properties.json"
        )

    data = json.loads(properties_json_path.read_text(encoding="utf-8"))
    config = data.get("config", {})
    properties = data.get("properties", [])

    results = []
    fichas_dir = Path(__file__).parent

    for prop in properties:
        prop_id = prop.get("id")
        if not prop_id:
            continue

        # Enriquecer con datos de contacto globales
        enriched = {**prop, **{k: v for k, v in config.items() if k not in prop}}

        output_dir = fichas_dir / prop_id / "instagram"
        paths = generate_for_property(enriched, output_dir)
        results.append(
            {
                "id": prop_id,
                "card": str(paths["card"]),
                "caption": str(paths["caption"]),
            }
        )

    return results


if __name__ == "__main__":
    generated = generate_all()
    print(f"Generado contenido de Instagram para {len(generated)} propiedades")
    for item in generated[:3]:
        print(f"- {item['id']}: {item['card']} | {item['caption']}")
