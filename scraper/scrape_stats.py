"""
Scraper de estadísticas reales (minutos, goles, asistencias, tarjetas…) en
futbolfantasy.com

QUÉ HACE
--------
Una página por equipo:

  https://www.futbolfantasy.com/analytics/<equipo>/estadisticas

La tabla trae ~40 columnas y cada fila guarda los valores en atributos
`data-<n>-total` (también `-casa` y `-fuera`, que aquí no se usan). El
número <n> no es fijo por significado, así que NO se puede cablear: la
cabecera es la que dice qué es cada columna, con `data-sort="<n>"` y
`data-tooltip="Minutos jugados"`. Se lee esa cabecera en cada página y se
extraen solo las columnas de STAT_BY_TOOLTIP. Si la web reordena o añade
columnas, esto sigue funcionando; si renombra un tooltip, esa estadística
deja de aparecer (y `main()` lo avisa) en vez de publicar un número que no
es el que dice ser.

El id del jugador sale de la URL de su foto de ficha, igual que en
scrape_status.py (mismo espacio de ids que data-id del mercado).

La lista de equipos se saca de los enlaces de la propia página de mercado,
para no cablear 20 slugs que cambian cada verano con ascensos y descensos.

Salida: data/raw/estadisticas_YYYY-MM-DD.json

Uso:
  python scrape_stats.py
"""

import json
import re
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

# La portada de /analytics no lista los equipos; el menú lateral de la
# página de mercado sí (es la misma que usa scrape_market.py).
ANALYTICS_URL = "https://www.futbolfantasy.com/analytics/laliga-fantasy/mercado"
TEAM_STATS_URL = "https://www.futbolfantasy.com/analytics/{team}/estadisticas"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "es-ES,es;q=0.9",
}

OUT_DIR = Path(__file__).parent / "data" / "raw"
REQUEST_DELAY_SECONDS = 0.3

PLAYER_ID_RE = re.compile(r"/jugadores/ficha/(\d+)\.png")
TEAM_SLUG_RE = re.compile(r"/analytics/([a-z0-9-]+)/estadisticas")

# Tooltip exacto de la cabecera -> nombre del campo publicado. Solo lo que
# se usa en el front; el resto de columnas (regates, centros, faltas
# colgadas…) se ignora a propósito.
STAT_BY_TOOLTIP = {
    "Minutos jugados": "minutes",
    "Goles": "goals",
    "Asistencias": "assists",
    "Tarjetas amarillas": "yellow",
    "Tarjetas rojas": "red",
    "Paradas": "saves",
    "Goles encajados": "conceded",
}


def fetch_html(url: str) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.text


def team_slugs(html: str):
    slugs = sorted(set(TEAM_SLUG_RE.findall(html)))
    if not slugs:
        raise RuntimeError(
            "No se encontró ningún enlace '/analytics/<equipo>/estadisticas' en "
            f"{ANALYTICS_URL}. La web ha debido cambiar, revisa team_slugs()."
        )
    return slugs


def column_indexes(soup):
    """{'minutes': '2', 'goals': '3', ...} leído de la cabecera de la tabla."""
    indexes = {}
    for th in soup.select("th[data-tooltip][data-sort]"):
        field = STAT_BY_TOOLTIP.get(th["data-tooltip"].strip())
        if field:
            indexes[field] = th["data-sort"]
    return indexes


def _number_or_none(value):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return int(number) if number.is_integer() else number


def player_id(row):
    for img in row.select("img"):
        for attribute in ("data-src", "src"):
            match = PLAYER_ID_RE.search(img.get(attribute) or "")
            if match:
                return match.group(1)
    return None


def parse_team(html: str):
    soup = BeautifulSoup(html, "html.parser")
    indexes = column_indexes(soup)

    players = []
    for row in soup.select("tr[data-name]"):
        identifier = player_id(row)
        if identifier is None:
            continue  # sin foto de ficha no se puede cruzar con el mercado

        stats = {}
        for field, index in indexes.items():
            value = _number_or_none(row.get(f"data-{index}-total"))
            if value is not None:
                stats[field] = value
        if stats:
            players.append({"slug": identifier, "stats": stats})
    return players, set(indexes)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    slugs = team_slugs(fetch_html(ANALYTICS_URL))

    by_id = {}
    found_fields = set()
    errors = 0
    for i, slug in enumerate(slugs):
        if i > 0:
            time.sleep(REQUEST_DELAY_SECONDS)
        try:
            players, fields = parse_team(fetch_html(TEAM_STATS_URL.format(team=slug)))
        except Exception as exc:  # noqa: BLE001 - un equipo raro no debe tumbar los otros 19
            print(f"[aviso] {slug}: {exc}")
            errors += 1
            continue
        found_fields |= fields
        for player in players:
            by_id[player["slug"]] = player

    missing = sorted(set(STAT_BY_TOOLTIP.values()) - found_fields)
    if missing:
        print(f"[aviso] columnas no encontradas en ninguna página: {missing}")

    today = datetime.now(ZoneInfo("Europe/Madrid")).date().isoformat()
    out_path = OUT_DIR / f"estadisticas_{today}.json"
    out_path.write_text(
        json.dumps(
            {"date": today, "players": list(by_id.values())}, ensure_ascii=False, indent=2
        ),
        encoding="utf-8",
    )
    print(
        f"[ok] {len(by_id)} jugadores con estadísticas de {len(slugs) - errors}/{len(slugs)} "
        f"equipos guardados en {out_path}"
    )


if __name__ == "__main__":
    main()
