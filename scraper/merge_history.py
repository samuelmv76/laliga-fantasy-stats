"""
Fusiona el scrape del día (data/raw/mercado_YYYY-MM-DD.json) dentro del
fichero canónico data/jugadores.json, que es el que consume el front (con
el mismo formato que src/data/mockPlayers.js pero con datos reales).

Formato de salida (uno por jugador):
{
  "id": "kylian-mbappe",       # el slug de futbolfantasy, estable en el tiempo
  "name": "Kylian Mbappé",
  "team": "Real Madrid",
  "pos": "DEL",                 # "?" si aún no se ha rellenado a mano
  "points": 0,                  # de momento a 0; se cruza más adelante con
                                 # la página de puntos si hace falta
  "priceHistory": [
    {"date": "2026-09-07", "price": 79.1},
    {"date": "2026-09-08", "price": 80.2}
  ]
}

Se ejecuta con: python merge_history.py data/raw/mercado_2026-09-08.json
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent
CANONICAL_PATH = ROOT / "data" / "jugadores.json"


def to_millions(price_euros):
    if price_euros is None:
        return None
    return round(price_euros / 1_000_000, 1)


def load_canonical():
    if CANONICAL_PATH.exists():
        return json.loads(CANONICAL_PATH.read_text(encoding="utf-8"))
    return []


def save_canonical(players):
    CANONICAL_PATH.parent.mkdir(parents=True, exist_ok=True)
    CANONICAL_PATH.write_text(
        json.dumps(players, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def merge(raw_scrape_path: Path):
    raw = json.loads(raw_scrape_path.read_text(encoding="utf-8"))
    scrape_date = raw["date"]
    scraped_players = raw["players"]

    canonical = load_canonical()
    by_id = {p["id"]: p for p in canonical}

    added, updated = 0, 0

    for sp in scraped_players:
        player_id = sp.get("slug") or sp.get("name")
        if not player_id:
            continue

        price = to_millions(sp.get("price"))
        if price is None:
            continue  # sin precio no hay nada que guardar hoy

        entry = by_id.get(player_id)
        if entry is None:
            entry = {
                "id": player_id,
                "name": sp.get("name"),
                "team": sp.get("team"),
                "pos": sp.get("pos", "?"),
                "points": sp.get("points", 0),
                "priceHistory": [],
            }
            by_id[player_id] = entry
            added += 1
        else:
            updated += 1

        history = entry["priceHistory"]
        # si ya existe un punto para hoy (re-ejecución), lo sustituye en vez
        # de duplicarlo
        history[:] = [h for h in history if h["date"] != scrape_date]
        history.append({"date": scrape_date, "price": price})
        history.sort(key=lambda h: h["date"])

    save_canonical(list(by_id.values()))
    print(f"[ok] {added} jugadores nuevos, {updated} actualizados. "
          f"Total en {CANONICAL_PATH}: {len(by_id)}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python merge_history.py data/raw/mercado_YYYY-MM-DD.json")
        sys.exit(1)
    merge(Path(sys.argv[1]))
