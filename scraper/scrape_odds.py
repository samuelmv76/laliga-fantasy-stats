"""
Cuotas 1X2 de los próximos partidos de LaLiga.

FUENTE
------
https://www.football-data.co.uk/fixtures.csv — el fichero de próximos
partidos de football-data.co.uk, que agrega las cuotas de las casas
(Bet365, Pinnacle, William Hill…) de varias ligas. Es CSV plano, sin
API key ni scraping de HTML. La liga española es `Div == SP1`.

Se usan las cuotas MEDIAS del mercado (AvgH/AvgD/AvgA) porque suavizan el
sesgo de una casa concreta; si no vienen, se cae a Bet365 (B365*) y luego a
la máxima del mercado (MaxH/MaxD/MaxA).

Los nombres de equipo de football-data no son los del mercado fantasy
("Ath Bilbao" vs "Athletic"), así que se normalizan con TEAM_ALIASES.

Uso:
  python scrape_odds.py                       # solo descarga y resume
  python scrape_odds.py data/raw/mercado_2026-09-14.json
"""

import csv
import json
import sys
import unicodedata
from datetime import datetime
from io import StringIO
from pathlib import Path
from zoneinfo import ZoneInfo

import requests

FIXTURES_CSV_URL = "https://www.football-data.co.uk/fixtures.csv"
LEAGUE = "SP1"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}

OUT_DIR = Path(__file__).parent / "data" / "raw"

# Tríos de columnas de cuotas, en orden de preferencia.
ODDS_COLUMNS = [("AvgH", "AvgD", "AvgA"), ("B365H", "B365D", "B365A"), ("MaxH", "MaxD", "MaxA")]

# football-data -> nombre en el mercado fantasy. Solo los que no coinciden
# tras normalizar (minúsculas y sin acentos).
TEAM_ALIASES = {
    "ath bilbao": "Athletic",
    "ath madrid": "Atlético",
    "atl madrid": "Atlético",
    "sociedad": "Real Sociedad",
    "espanol": "Espanyol",
    "vallecano": "Rayo Vallecano",
    "celta": "Celta",
    "betis": "Betis",
    "la coruna": "Deportivo",
    "alaves": "Alavés",
    "cadiz": "Cádiz",
    "leganes": "Leganés",
    "almeria": "Almería",
    "malaga": "Málaga",
}


def normalize(name: str) -> str:
    text = unicodedata.normalize("NFD", (name or "").strip().lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def canonical_team(name: str, known_teams: dict) -> str:
    """Nombre tal y como lo usa el mercado, si se reconoce; si no, el original."""
    key = normalize(name)
    key = normalize(TEAM_ALIASES.get(key, name))
    return known_teams.get(key, TEAM_ALIASES.get(normalize(name), name.strip()))


def teams_from_market(market_path: Path) -> dict:
    """{nombre normalizado: nombre del mercado} para casar con football-data."""
    raw = json.loads(market_path.read_text(encoding="utf-8"))
    teams = {p["team"] for p in raw["players"] if p.get("team")}
    return {normalize(t): t for t in teams}


def parse_odds(row: dict):
    for home_col, draw_col, away_col in ODDS_COLUMNS:
        try:
            home, draw, away = (float(row[c]) for c in (home_col, draw_col, away_col))
        except (KeyError, TypeError, ValueError):
            continue
        if home > 1 and draw > 1 and away > 1:
            return {"home": home, "draw": draw, "away": away}
    return None


def parse_kickoff(row: dict):
    # Date viene como dd/mm/yyyy y Time como HH:MM (hora de Londres).
    date_text, time_text = (row.get("Date") or "").strip(), (row.get("Time") or "00:00").strip()
    for date_format in ("%d/%m/%Y", "%d/%m/%y"):
        try:
            day = datetime.strptime(date_text, date_format)
            break
        except ValueError:
            day = None
    if day is None:
        return None
    try:
        hour, minute = (int(x) for x in time_text.split(":")[:2])
    except ValueError:
        hour, minute = 0, 0
    london = datetime(day.year, day.month, day.day, hour, minute, tzinfo=ZoneInfo("Europe/London"))
    return london.astimezone(ZoneInfo("Europe/Madrid"))


def main():
    known_teams = teams_from_market(Path(sys.argv[1])) if len(sys.argv) > 1 else {}

    response = requests.get(FIXTURES_CSV_URL, headers=HEADERS, timeout=30)
    response.raise_for_status()
    # el CSV viene con BOM: sin quitarlo la primera columna se llamaría "﻿Div"
    text = response.content.decode("utf-8-sig", errors="replace")

    matches = []
    for row in csv.DictReader(StringIO(text)):
        if (row.get("Div") or "").strip() != LEAGUE:
            continue
        odds = parse_odds(row)
        kickoff = parse_kickoff(row)
        if not odds or kickoff is None:
            continue
        matches.append(
            {
                "kickoff": kickoff.isoformat(),
                "date": kickoff.date().isoformat(),
                "home": canonical_team(row.get("HomeTeam", ""), known_teams),
                "away": canonical_team(row.get("AwayTeam", ""), known_teams),
                "odds": odds,
            }
        )

    today = datetime.now(ZoneInfo("Europe/Madrid")).date()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"cuotas_{today.isoformat()}.json"
    out_path.write_text(
        json.dumps({"date": today.isoformat(), "source": FIXTURES_CSV_URL, "matches": matches},
                   ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"[ok] {len(matches)} partidos con cuotas guardados en {out_path}")
    if not matches:
        print("[aviso] football-data publica fixtures.csv solo unos días antes de cada jornada.")


if __name__ == "__main__":
    main()
