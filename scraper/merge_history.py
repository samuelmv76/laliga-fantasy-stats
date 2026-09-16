"""
Fusiona los scrapes del día (data/raw/mercado_, puntos_, jornadas_,
estadisticas_ y estado_YYYY-MM-DD.json) dentro del fichero canónico
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
    {"date": "2026-08-10", "price": 29984533},
    {"date": "2026-09-09", "price": 42896693}
  ],
  "pointsHistory": [
    {"date": "2026-09-09", "points": 17}
  ],
  "pointsByMatchday": [
    {"matchday": 5, "points": 6}
  ],
  "played": 5,                  # partidos jugados en la temporada
  "played5": 4,                 # partidos jugados en las últimas 5 jornadas
  "status": "lesion",           # o "duda"/"sancion"; ausente si está disponible
  "statusNote": "Rotura de lig. cruzado anterior",
  "statusUntil": "Baja hasta abril",   # como lo publica la web; null en sanciones
  "playProbability": 0,         # % de que juegue el próximo partido
  "stats": {                    # acumulado de temporada, de /analytics/<equipo>/estadisticas
    "minutes": 450, "goals": 6, "assists": 1,
    "yellow": 0, "red": 0, "saves": 0, "conceded": 4
  }
}

La página de mercado trae, en la misma llamada, el precio exacto de hoy y el
de hace 1/2/3/7/14/30 días (data-valor, data-valor1... en el HTML) así que
un solo scrape ya deja varios puntos reales de histórico de precio. Los
puntos de temporada, en cambio, la web solo los da "a día de hoy": el
histórico de puntos se construye día a día, una entrada por ejecución.

Se ejecuta con:
  python merge_history.py data/raw/mercado_2026-09-09.json [data/raw/puntos_2026-09-09.json] [data/raw/jornadas_2026-09-09.json] [data/raw/estadisticas_2026-09-09.json] [data/raw/estado_2026-09-09.json]
"""

import json
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).parent
CANONICAL_PATH = ROOT / "data" / "jugadores.json"


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

        price_today = sp.get("price")
        if price_today is not None:
            set_history_point(entry["priceHistory"], scrape_date.isoformat(), price=price_today)

        for key, value in sp.items():
            if not key.startswith("price_") or not key.endswith("d_ago") or value is None:
                continue
            days_ago = int(key.removeprefix("price_").removesuffix("d_ago"))
            point_date = (scrape_date - timedelta(days=days_ago)).isoformat()
            set_history_point(entry["priceHistory"], point_date, price=value)

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
        # Partidos jugados: sin esto no se distingue "jugó y sacó 0" de "no jugó".
        if sp.get("played") is not None:
            entry["played"] = sp["played"]
        if sp.get("played5") is not None:
            entry["played5"] = sp["played5"]
        entry.setdefault("pointsHistory", [])
        set_history_point(entry["pointsHistory"], scrape_date, points=sp["points"])
        matched += 1

    print(f"[ok] puntos: {matched} jugadores actualizados.")


def set_matchday_point(history, matchday, points):
    """Inserta/reemplaza un punto por jornada exacta (idempotente ante re-ejecuciones)."""
    history[:] = [h for h in history if h["matchday"] != matchday]
    history.append({"matchday": matchday, "points": points})
    history.sort(key=lambda h: h["matchday"])


def merge_jornadas(raw_scrape_path: Path, by_id: dict):
    raw = json.loads(raw_scrape_path.read_text(encoding="utf-8"))

    matched = 0
    for player_id, matchdays in raw["players"].items():
        entry = by_id.get(player_id)
        if entry is None:
            continue  # jugador sin ficha en el mercado, se ignora
        entry.setdefault("pointsByMatchday", [])
        for md in matchdays:
            set_matchday_point(entry["pointsByMatchday"], md["matchday"], md["points"])
        matched += 1

    print(f"[ok] jornadas: {matched} jugadores actualizados.")


def merge_status(raw_scrape_path: Path, by_id: dict):
    """Estado deportivo del día. El fichero es la foto completa de quién está
    lesionado/sancionado hoy, así que a todos los demás se les BORRA el estado:
    si no, un jugador recuperado se quedaría lesionado para siempre."""
    raw = json.loads(raw_scrape_path.read_text(encoding="utf-8"))
    by_scraped_id = {p["slug"]: p for p in raw["players"] if p.get("slug")}

    matched = 0
    for player_id, entry in by_id.items():
        scraped = by_scraped_id.get(player_id)
        status = scraped.get("status") if scraped else None
        if status:
            entry["status"] = status
            entry["statusNote"] = scraped.get("note")
            entry["statusUntil"] = scraped.get("until")
            entry["playProbability"] = scraped.get("playProbability")
            matched += 1
        else:
            entry.pop("status", None)
            entry.pop("statusNote", None)
            entry.pop("statusUntil", None)
            entry.pop("playProbability", None)

    unknown = len(by_scraped_id) - sum(1 for k in by_scraped_id if k in by_id)
    print(f"[ok] estado: {matched} jugadores con baja ({unknown} sin ficha en el mercado).")


def merge_stats(raw_scrape_path: Path, by_id: dict):
    """Estadísticas reales acumuladas (minutos, goles, asistencias…). Se
    sustituyen enteras: la web publica el acumulado de temporada, no un delta."""
    raw = json.loads(raw_scrape_path.read_text(encoding="utf-8"))

    matched = 0
    for sp in raw["players"]:
        entry = by_id.get(sp.get("slug"))
        if entry is None:
            continue  # jugador sin ficha en el mercado, se ignora
        entry["stats"] = sp["stats"]
        matched += 1

    print(f"[ok] estadísticas: {matched} jugadores actualizados.")


def main(paths):
    by_id = {p["id"]: p for p in load_canonical()}

    for path in paths:
        if path.name.startswith("mercado_"):
            merge_market(path, by_id)
        elif path.name.startswith("puntos_"):
            merge_points(path, by_id)
        elif path.name.startswith("jornadas_"):
            merge_jornadas(path, by_id)
        elif path.name.startswith("estadisticas_"):
            merge_stats(path, by_id)
        elif path.name.startswith("estado_"):
            merge_status(path, by_id)
        else:
            print(
                f"[aviso] '{path.name}' no empieza por 'mercado_', 'puntos_', 'jornadas_', "
                "'estadisticas_' ni 'estado_', se ignora."
            )

    save_canonical(list(by_id.values()))
    print(f"[ok] total en {CANONICAL_PATH}: {len(by_id)}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(
            "Uso: python merge_history.py data/raw/mercado_YYYY-MM-DD.json "
            "[data/raw/puntos_...] [data/raw/jornadas_...] [data/raw/estadisticas_...] [data/raw/estado_...]"
        )
        sys.exit(1)
    main([Path(p) for p in sys.argv[1:]])
