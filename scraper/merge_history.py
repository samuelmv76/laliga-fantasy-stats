"""
Fusiona los scrapes del día (data/raw/mercado_YYYY-MM-DD.json y, si existe,
data/raw/puntos_YYYY-MM-DD.json) dentro del fichero canónico
data/jugadores.json, que es el que consume el front (mismo formato que
src/data/mockPlayers.js pero con datos reales).

Formato de salida (uno por jugador):
{
  "id": "1059",                 # id numérico de futbolfantasy, estable
  "name": "Antonio Sivera",
  "team": "Alavés",
  "pos": "POR",
  "points": 17,                 # total de la temporada, exacto
  "priceHistory": [
    {"date": "2026-08-10", "price": 29.98},
    {"date": "2026-09-09", "price": 42.9}
  ],
  "pointsHistory": [
    {"date": "2026-09-09", "points": 17}
  ]
}

La página de mercado trae, en la misma llamada, el precio exacto de hoy y el
de hace 1/2/3/7/14/30 días (data-valor, data-valor1... en el HTML) así que
un solo scrape ya deja varios puntos reales de histórico de precio. Los
puntos de temporada, en cambio, la web solo los da "a día de hoy": el
histórico de puntos se construye día a día, una entrada por ejecución.

Se ejecuta con:
  python merge_history.py data/raw/mercado_2026-09-09.json [data/raw/puntos_2026-09-09.json]
"""

import json
import sys
from datetime import date, timedelta
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


def set_history_point(history, entry_date, **fields):
    """Inserta/reemplaza un punto por fecha exacta (idempotente ante re-ejecuciones)."""
    history[:] = [h for h in history if h["date"] != entry_date]
    history.append({"date": entry_date, **fields})
    history.sort(key=lambda h: h["date"])


def merge_market(raw_scrape_path: Path, by_id: dict):
    raw = json.loads(raw_scrape_path.read_text(encoding="utf-8"))
    scrape_date = date.fromisoformat(raw["date"])

    added, updated = 0, 0
    for sp in raw["players"]:
        player_id = sp.get("slug") or sp.get("name")
        if not player_id:
            continue

        entry = by_id.get(player_id)
        if entry is None:
            entry = {
                "id": player_id,
                "name": sp.get("name"),
                "team": sp.get("team"),
                "pos": sp.get("pos", "?"),
                "points": 0,
                "priceHistory": [],
                "pointsHistory": [],
            }
            by_id[player_id] = entry
            added += 1
        else:
            entry["name"] = sp.get("name") or entry["name"]
            entry["team"] = sp.get("team") or entry["team"]
            entry["pos"] = sp.get("pos") or entry["pos"]
            updated += 1

        set_history_point(entry["priceHistory"], scrape_date.isoformat(), price=to_millions(sp.get("price")))
        for key, value in sp.items():
            if not key.startswith("price_") or not key.endswith("d_ago"):
                continue
            days_ago = int(key.removeprefix("price_").removesuffix("d_ago"))
            price = to_millions(value)
            if price is None:
                continue
            point_date = (scrape_date - timedelta(days=days_ago)).isoformat()
            set_history_point(entry["priceHistory"], point_date, price=price)

    print(f"[ok] mercado: {added} jugadores nuevos, {updated} actualizados.")


def merge_points(raw_scrape_path: Path, by_id: dict):
    raw = json.loads(raw_scrape_path.read_text(encoding="utf-8"))
    scrape_date = raw["date"]

    matched = 0
    for sp in raw["players"]:
        entry = by_id.get(sp.get("slug"))
        if entry is None:
            continue  # jugador sin ficha en el mercado de hoy, se ignora

        entry["points"] = sp["points"]
        entry.setdefault("pointsHistory", [])
        set_history_point(entry["pointsHistory"], scrape_date, points=sp["points"])
        matched += 1

    print(f"[ok] puntos: {matched} jugadores actualizados.")


def main(paths):
    by_id = {p["id"]: p for p in load_canonical()}

    for path in paths:
        if path.name.startswith("mercado_"):
            merge_market(path, by_id)
        elif path.name.startswith("puntos_"):
            merge_points(path, by_id)
        else:
            print(f"[aviso] '{path.name}' no empieza por 'mercado_' ni 'puntos_', se ignora.")

    save_canonical(list(by_id.values()))
    print(f"[ok] total en {CANONICAL_PATH}: {len(by_id)}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python merge_history.py data/raw/mercado_YYYY-MM-DD.json [data/raw/puntos_YYYY-MM-DD.json]")
        sys.exit(1)
    main([Path(p) for p in sys.argv[1:]])
