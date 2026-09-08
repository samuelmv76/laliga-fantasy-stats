"""
Scraper del mercado de LaLiga Fantasy Oficial en futbolfantasy.com

QUÉ HACE
--------
Descarga la página de mercado y lee los datos directamente de los atributos
`data-*` de cada fila (<tr class="elemento_jugador" data-id="..." data-valor="...">),
que el propio HTML ya trae completos y sin formatear (nada de "42.511.625" que
parsear a mano). Un fichero por ejecución: data/raw/mercado_YYYY-MM-DD.json

Si futbolfantasy.com cambia la estructura de la tabla, `parse_table()`
lanzará RuntimeError porque no encontrará ninguna fila; ahí toca volver a
inspeccionar la página (botón derecho -> Ver código fuente, buscar un
jugador conocido) y ajustar los selectores.
"""

import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

MARKET_URL = "https://www.futbolfantasy.com/analytics/laliga-fantasy/mercado"

HEADERS = {
    # Un User-Agent de navegador normal; muchos sitios bloquean el
    # user-agent por defecto de requests/python.
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "es-ES,es;q=0.9",
}

# Texto de data-posicion -> código corto usado en el front. "Entrenador"
# se descarta a propósito: no tiene ficha de jugador en la app.
POSITION_MAP = {
    "Portero": "POR",
    "Defensa": "DEF",
    "Mediocampista": "MID",
    "Delantero": "DEL",
}

OUT_DIR = Path(__file__).parent / "data" / "raw"


def fetch_html(url: str) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.text


def parse_table(html: str):
    soup = BeautifulSoup(html, "html.parser")
    rows = soup.select("tr.elemento_jugador")
    if not rows:
        raise RuntimeError(
            "No se encontró ninguna fila 'tr.elemento_jugador'. "
            "La web ha debido cambiar de estructura, revisa parse_table()."
        )

    players = []
    for tr in rows:
        pos = POSITION_MAP.get(tr.get("data-posicion"))
        if pos is None:
            continue  # entrenadores u otras filas sin ficha de jugador

        price = tr.get("data-valor")
        if not price:
            continue  # sin precio no hay nada que guardar hoy

        name_el = tr.select_one(".player-name span.d-md-inline")
        team_el = tr.select_one(".player-equipo span")

        players.append({
            "slug": tr.get("data-id"),
            "name": name_el.get_text(strip=True) if name_el else tr.get("data-nombre"),
            "team": team_el.get_text(strip=True) if team_el else None,
            "pos": pos,
            "price": int(price),
        })
    return players


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    html = fetch_html(MARKET_URL)
    players = parse_table(html)

    today = datetime.now(ZoneInfo("Europe/Madrid")).date().isoformat()
    out_path = OUT_DIR / f"mercado_{today}.json"
    out_path.write_text(
        json.dumps({"date": today, "players": players}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"[ok] {len(players)} jugadores guardados en {out_path}")


if __name__ == "__main__":
    main()
