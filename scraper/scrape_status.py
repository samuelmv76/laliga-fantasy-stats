"""
Scraper de estado deportivo (lesión / duda / sanción) en futbolfantasy.com

QUÉ HACE
--------
Lee dos páginas públicas y las fusiona en un único estado por jugador:

  https://www.futbolfantasy.com/laliga/lesionados   -> lesionados y dudas
  https://www.futbolfantasy.com/laliga/sancionados  -> sancionados

Cada jugador es un `<div class="elemento lesionado|sancionado">`. El id
numérico (el mismo que data-id del mercado) sale de la URL de su foto de
ficha: .../uploads/images/jugadores/ficha/<id>.png

El estado NO se deduce del porcentaje: la propia página pone un icono
distinto según el caso (lesionado_box_min.png / duda_box_min.png /
disponible_box_min.png), así que se usa ese nombre de fichero, que es lo
que la web considera oficial. El porcentaje de la ficha ("0%", "70%") se
guarda aparte como `playProbability`: es la probabilidad de que juegue el
próximo partido.

Un jugador puede aparecer como "disponible" en la página de lesionados
(recién recuperado). Se publica con status null a propósito: así
merge_history.py le borra el estado anterior en vez de dejarlo lesionado
para siempre.

Salida: data/raw/estado_YYYY-MM-DD.json

Uso:
  python scrape_status.py
"""

import json
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

INJURED_URL = "https://www.futbolfantasy.com/laliga/lesionados"
SUSPENDED_URL = "https://www.futbolfantasy.com/laliga/sancionados"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "es-ES,es;q=0.9",
}

OUT_DIR = Path(__file__).parent / "data" / "raw"

PLAYER_ID_RE = re.compile(r"/jugadores/ficha/(\d+)\.png")
ICON_RE = re.compile(r"/([a-zA-Z0-9_]+)_box_min\.png")
PERCENT_RE = re.compile(r"(\d{1,3})\s*%")

# Nombre del icono de la web -> clave de PLAYER_STATUS en el front.
# "disponible" es un jugador ya recuperado: sin estado.
ICON_STATUS = {
    "lesionado": "lesion",
    "duda": "duda",
    "disponible": None,
}


def fetch_html(url: str) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.text


def player_id(element):
    """Id numérico de futbolfantasy a partir de la foto de ficha."""
    for img in element.select("img"):
        for attribute in ("data-src", "src"):
            match = PLAYER_ID_RE.search(img.get(attribute) or "")
            if match:
                return match.group(1)
    return None


def play_probability(element):
    widget = element.select_one(".probabilidad-widget")
    match = PERCENT_RE.search(widget.get_text(strip=True)) if widget else None
    if not match:
        return None
    value = int(match.group(1))
    return value if 0 <= value <= 100 else None


def note(element):
    """Texto corto para el tooltip: tipo de lesión y hasta cuándo es baja."""
    parts = [
        span.get_text(" ", strip=True)
        for span in element.select(".comentario > span, .datos > span.sancion")
        if span.find("i", class_="fa-calendar") is None
    ]
    return " · ".join(p for p in parts if p) or None


def parse_injured(html: str):
    soup = BeautifulSoup(html, "html.parser")
    elements = soup.select(".elemento.lesionado")
    if not elements:
        raise RuntimeError(
            "No se encontró ningún '.elemento.lesionado' en la página de lesionados. "
            "La web ha debido cambiar de estructura, revisa parse_injured()."
        )

    players = []
    for element in elements:
        identifier = player_id(element)
        if identifier is None:
            continue  # jugador sin foto de ficha: no se puede cruzar con el mercado

        icon = element.select_one(".icono-wrapper img, .icono img")
        icon_match = ICON_RE.search(icon.get("src") or "") if icon else None
        icon_name = icon_match.group(1) if icon_match else None
        if icon_name not in ICON_STATUS:
            continue  # icono desconocido: mejor no inventarse el estado

        players.append(
            {
                "slug": identifier,
                "status": ICON_STATUS[icon_name],
                "note": note(element),
                "playProbability": play_probability(element),
            }
        )
    return players


def parse_suspended(html: str):
    soup = BeautifulSoup(html, "html.parser")
    # Sin sancionados la lista puede estar vacía de forma legítima (no es un
    # error de scraping, a diferencia de la de lesionados).
    players = []
    for element in soup.select(".elemento.sancionado"):
        identifier = player_id(element)
        if identifier is None:
            continue
        players.append(
            {
                "slug": identifier,
                "status": "sancion",
                "note": note(element),
                "playProbability": 0,
            }
        )
    return players


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    injured = parse_injured(fetch_html(INJURED_URL))
    suspended = parse_suspended(fetch_html(SUSPENDED_URL))

    # La sanción manda sobre la lesión: si está sancionado no juega, da igual
    # cómo tenga el tobillo.
    by_id = {p["slug"]: p for p in injured}
    by_id.update({p["slug"]: p for p in suspended})
    players = list(by_id.values())

    today = datetime.now(ZoneInfo("Europe/Madrid")).date().isoformat()
    out_path = OUT_DIR / f"estado_{today}.json"
    out_path.write_text(
        json.dumps({"date": today, "players": players}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    counts = {}
    for p in players:
        counts[p["status"]] = counts.get(p["status"], 0) + 1
    print(f"[ok] {len(players)} jugadores con estado guardados en {out_path} ({counts})")


if __name__ == "__main__":
    main()
