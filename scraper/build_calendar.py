"""
Publica el scrape del calendario (data/raw/calendario_YYYY-MM-DD.json, ya
agrupado por equipo) como el fichero canónico que consume el front
(data/calendario.json), mismo formato que src/data/mockFixtures.js.

A diferencia de jugadores.json, este fichero NO acumula histórico: cada
ejecución lo sustituye entero, porque solo interesan los partidos que aún
no se han jugado (scrape_fixtures.py ya descarta los que sí).

Uso:
  python build_calendar.py data/raw/calendario_2026-09-14.json
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent
CANONICAL_PATH = ROOT / "data" / "calendario.json"


def main(raw_path: Path):
    raw = json.loads(raw_path.read_text(encoding="utf-8"))
    by_team = raw["fixtures"]

    CANONICAL_PATH.parent.mkdir(parents=True, exist_ok=True)
    CANONICAL_PATH.write_text(json.dumps(by_team, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[ok] calendario de {len(by_team)} equipos guardado en {CANONICAL_PATH}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python build_calendar.py data/raw/calendario_YYYY-MM-DD.json")
        sys.exit(1)
    main(Path(sys.argv[1]))
