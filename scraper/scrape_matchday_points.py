"""
Scraper de puntos por jornada de LaLiga Fantasy Oficial en futbolfantasy.com

QUÉ HACE
--------
scrape_points.py solo trae el total de puntos de la temporada por jugador;
el desglose por jornada no está en ninguna tabla, se pide por AJAX al abrir
la ficha de un jugador en la página de puntos (función JS
`openPlayerPointsStats`, verificada en el HTML real de la página):

  GET /analytics/stats/detalle/<id>/2027?stat=puntuacion

("2027" es el id interno de temporada que usa la propia web en su JS,
igual para todos los jugadores esta temporada — revisar si cambia la
próxima campaña).

La respuesta trae un bloque por jornada jugada:

  <div class="sd-row" data-jornada="J5"
       data-puntos='{"laliga-fantasy": 12, "fantasy": 16, ...}'>

Nos quedamos con la clave "laliga-fantasy" (el modo de puntuación que usa
esta app). Comprobado a mano: la suma de esas jornadas coincide con el
total de scrape_points.py.

No hay endpoint en bloque: es una petición POR JUGADOR, así que con ~650
jugadores esto tarda varios minutos — pausa pequeña entre peticiones por
cortesía con el servidor.

Uso:
  python scrape_matchday_points.py data/jugadores.json
"""

import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

DETAIL_URL = "https://www.futbolfantasy.com/analytics/stats/detalle/{player_id}/2027?stat=puntuacion"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "es-ES,es;q=0.9",
    "X-Requested-With": "XMLHttpRequest",
}

OUT_DIR = Path(__file__).parent / "data" / "raw"
REQUEST_DELAY_SECONDS = 0.3
JORNADA_RE = re.compile(r"^J(\d+)$")


def fetch_html(url: str) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.text


def parse_matchday_points(html: str):
    soup = BeautifulSoup(html, "html.parser")
    points = []
    for row in soup.select(".sd-row[data-jornada]"):
        match = JORNADA_RE.match(row.get("data-jornada", ""))
        raw_puntos = row.get("data-puntos")
        if not match or not raw_puntos:
            continue
        try:
            modes = json.loads(raw_puntos)
        except json.JSONDecodeError:
            continue
        if not isinstance(modes, dict):
            continue  # p.ej. '[]' cuando el jugador no tiene datos esa jornada
        value = modes.get("laliga-fantasy")
        if value is None:
            continue
        points.append({"matchday": int(match.group(1)), "points": value})
    points.sort(key=lambda p: p["matchday"])
    return points


def main():
    if len(sys.argv) < 2:
        print("Uso: python scrape_matchday_points.py data/jugadores.json")
        sys.exit(1)

    players = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))

    by_player = {}
    errors = 0
    for i, player in enumerate(players):
        if i > 0:
            time.sleep(REQUEST_DELAY_SECONDS)
        try:
            html = fetch_html(DETAIL_URL.format(player_id=player["id"]))
            matchday_points = parse_matchday_points(html)
        except Exception as exc:  # noqa: BLE001 - un jugador raro no debe tumbar los otros 650
            errors += 1
            print(f"[aviso] fallo con '{player['name']}' ({player['id']}): {exc}")
            continue
        if matchday_points:
            by_player[player["id"]] = matchday_points

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    today = datetime.now(ZoneInfo("Europe/Madrid")).date().isoformat()
    out_path = OUT_DIR / f"jornadas_{today}.json"
    out_path.write_text(
        json.dumps({"date": today, "players": by_player}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    total = sum(len(v) for v in by_player.values())
    print(
        f"[ok] {total} puntuaciones por jornada de {len(by_player)} jugadores guardadas en {out_path} "
        f"({errors} fallos)"
    )


if __name__ == "__main__":
    main()
