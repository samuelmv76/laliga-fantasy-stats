"""
Scraper de puntos de LaLiga Fantasy Oficial en futbolfantasy.com

Lee el total de puntos de la temporada de cada jugador desde el atributo
data-puntostemporada de la tabla de puntos. A diferencia de la página de
mercado, aquí la fila no trae un data-id: el id del jugador va como primer
argumento de openPlayerPointsStats(id, ...) en el onclick de la fila (mismo
espacio de ids que data-id en scrape_market.py, comprobado a mano).
"""

import json
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

POINTS_URL = "https://www.futbolfantasy.com/analytics/laliga-fantasy/puntos"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "es-ES,es;q=0.9",
}

ONCLICK_ID_RE = re.compile(r"openPlayerPointsStats\((\d+)")

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
        match = ONCLICK_ID_RE.search(tr.get("onclick", ""))
        total = tr.get("data-puntostemporada")
        if not match or total is None or total == "":
            continue

        players.append({"slug": match.group(1), "points": int(total)})
    return players


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    html = fetch_html(POINTS_URL)
    players = parse_table(html)

    today = datetime.now(ZoneInfo("Europe/Madrid")).date().isoformat()
    out_path = OUT_DIR / f"puntos_{today}.json"
    out_path.write_text(
        json.dumps({"date": today, "players": players}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"[ok] {len(players)} jugadores con puntos guardados en {out_path}")


if __name__ == "__main__":
    main()
