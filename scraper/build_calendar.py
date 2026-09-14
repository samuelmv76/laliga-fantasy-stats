"""
Publica el scrape del calendario (data/raw/calendario_YYYY-MM-DD.json, ya
agrupado por equipo) como el fichero canónico que consume el front
(data/calendario.json), mismo formato que src/data/mockFixtures.js.

Si se le pasa además el fichero de cuotas (data/raw/cuotas_YYYY-MM-DD.json
de scrape_odds.py), añade a cada partido su `odds` 1X2; el front calcula con
ellas la probabilidad de victoria y la dificultad del rival.

A diferencia de jugadores.json, este fichero NO acumula histórico: cada
ejecución lo sustituye entero, porque solo interesan los partidos que aún
no se han jugado (scrape_fixtures.py ya descarta los que sí).

Uso:
  python build_calendar.py data/raw/calendario_2026-09-14.json
  python build_calendar.py data/raw/calendario_2026-09-14.json data/raw/cuotas_2026-09-14.json
"""

import json
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).parent
CANONICAL_PATH = ROOT / "data" / "calendario.json"


def normalize(name: str) -> str:
    text = unicodedata.normalize("NFD", (name or "").strip().lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def odds_index(odds_path: Path) -> dict:
    """{(local, visitante, fecha): odds} con los nombres ya normalizados."""
    raw = json.loads(odds_path.read_text(encoding="utf-8"))
    index = {}
    for match in raw.get("matches", []):
        key = (normalize(match["home"]), normalize(match["away"]), match.get("date"))
        index[key] = match["odds"]
    return index


def attach_odds(by_team: dict, index: dict) -> int:
    matched = 0
    for team, fixtures in by_team.items():
        for fixture in fixtures:
            home = team if fixture["home"] else fixture["opponent"]
            away = fixture["opponent"] if fixture["home"] else team
            date = (fixture.get("kickoff") or "")[:10]
            odds = index.get((normalize(home), normalize(away), date))
            if odds is None:
                # el CSV puede traer el partido con otro día (husos, aplazamientos)
                odds = next(
                    (v for (h, a, _), v in index.items() if h == normalize(home) and a == normalize(away)),
                    None,
                )
            if odds:
                fixture["odds"] = odds
                matched += 1
    return matched


def main(raw_path: Path, odds_path: Path | None):
    raw = json.loads(raw_path.read_text(encoding="utf-8"))
    by_team = raw["fixtures"]

    if odds_path:
        matched = attach_odds(by_team, odds_index(odds_path))
        total = sum(len(f) for f in by_team.values())
        print(f"[ok] cuotas asignadas a {matched} de {total} partidos.")

    CANONICAL_PATH.parent.mkdir(parents=True, exist_ok=True)
    CANONICAL_PATH.write_text(json.dumps(by_team, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[ok] calendario de {len(by_team)} equipos guardado en {CANONICAL_PATH}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python build_calendar.py data/raw/calendario_YYYY-MM-DD.json [data/raw/cuotas_YYYY-MM-DD.json]")
        sys.exit(1)
    main(Path(sys.argv[1]), Path(sys.argv[2]) if len(sys.argv) > 2 else None)
