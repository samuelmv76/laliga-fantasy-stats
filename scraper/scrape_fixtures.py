"""
Scraper del calendario de LaLiga Fantasy Oficial en futbolfantasy.com

QUÉ HACE
--------
La página general https://www.futbolfantasy.com/laliga/calendario resultó
NO servir para esto: reutiliza un widget de pestañas genérico compartido
por varias competiciones a la vez, y el número que se lee en la clase CSS
("jornadaN") es solo la posición de la pestaña, no la jornada real de
LaLiga (comprobado a mano: la pestaña "jornada1" en una carga resultó ser
la de la Premier League, y en otra parte de la misma página, la de LaLiga).
Solo sirve para dos cosas fiables: el mapa nombre de equipo -> slug de URL
(bloque `a.team[href="/laliga/equipos/<slug>"]`) y poco más.

En su lugar, pedimos la ficha de partidos de cada equipo:

  https://www.futbolfantasy.com/laliga/equipos/<slug>/partidos

que trae el calendario COMPLETO de la temporada para ese equipo, con la
jornada real y la competición explícitas en cada partido:

  <a class="partido" ...>                 (o class="partido won/lost/draw" si ya se jugó)
    <div class="logo ..."><img alt="LaLiga"/></div>
    <div class="equipo local"><img alt="Sevilla"/></div>
    <div class="info rsinfot">
      <div class="fase">Jornada 7</div>
      <div class="date">Sab 19/09 21:00h</div>   (si ya se jugó, aquí hay
                                                    un div.resultado con el
                                                    marcador en vez de esto)
    </div>
    <div class="equipo visitante"><img alt="Barcelona"/></div>
  </a>

Nada de adivinar por posición: filtramos por el alt="LaLiga" del logo de
competición (para no colarnos Champions/Europa League) y por que tenga
`.date` en vez de `.resultado` (para quedarnos solo con los partidos por
jugar).

Esto son ~20 peticiones (una por equipo) en vez de 1, así que vamos con una
pequeña pausa entre ellas por cortesía con el servidor.

Uso:
  python scrape_fixtures.py data/raw/mercado_2026-09-14.json
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

CALENDAR_URL = "https://www.futbolfantasy.com/laliga/calendario"
TEAM_FIXTURES_URL = "https://www.futbolfantasy.com/laliga/equipos/{slug}/partidos"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "es-ES,es;q=0.9",
}

OUT_DIR = Path(__file__).parent / "data" / "raw"

REQUEST_DELAY_SECONDS = 0.4
MAX_FIXTURES_PER_TEAM = 6

FASE_RE = re.compile(r"Jornada\s+(\d+)")
# "Sab 19/09 21:00h" -> ("19/09", "21:00")
DATE_TIME_RE = re.compile(r"(\d{2}/\d{2})\s+(\d{2}:\d{2})h")


def fetch_html(url: str) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.text


def teams_from_market(market_path: Path) -> set:
    raw = json.loads(market_path.read_text(encoding="utf-8"))
    return {p["team"] for p in raw["players"] if p.get("team")}


def team_slugs(calendar_html: str) -> dict:
    """Nombre de equipo (como aparece en el mercado) -> slug de su URL."""
    soup = BeautifulSoup(calendar_html, "html.parser")
    slugs = {}
    for a in soup.select('a.team[href*="/laliga/equipos/"]'):
        name = (a.get("title") or "").strip()
        slug = a["href"].rstrip("/").rsplit("/", 1)[-1]
        if name and slug:
            slugs[name] = slug
    return slugs


def parse_kickoff(date_text: str, today):
    match = DATE_TIME_RE.search(date_text)
    if not match:
        return None
    day_month, time_str = match.groups()
    day, month = (int(x) for x in day_month.split("/"))
    hour, minute = (int(x) for x in time_str.split(":"))
    # la web no publica el año; si el mes queda muy por detrás del actual
    # asumimos que ha cruzado a la temporada del año siguiente (dic -> ene)
    year = today.year + 1 if month < today.month - 6 else today.year
    return datetime(year, month, day, hour, minute, tzinfo=ZoneInfo("Europe/Madrid"))


def parse_team_fixtures(html: str, team_name: str, today):
    soup = BeautifulSoup(html, "html.parser")
    now = datetime.now(ZoneInfo("Europe/Madrid"))
    fixtures = []

    for a in soup.select("a.partido"):
        competition_img = a.select_one(".logo img")
        if not competition_img or (competition_img.get("alt") or "").strip() != "LaLiga":
            continue  # Champions League, Europa League...

        date_el = a.select_one(".date")
        fase_el = a.select_one(".fase")
        home_el = a.select_one(".equipo.local img")
        away_el = a.select_one(".equipo.visitante img")
        if not (date_el and fase_el and home_el and away_el):
            continue  # ya jugado (trae .resultado) o bloque incompleto

        fase_match = FASE_RE.search(fase_el.get_text())
        kickoff = parse_kickoff(date_el.get_text(" ", strip=True), today)
        if not fase_match or kickoff is None or kickoff < now:
            continue

        home = (home_el.get("alt") or "").strip()
        away = (away_el.get("alt") or "").strip()
        fixtures.append(
            {
                "matchday": int(fase_match.group(1)),
                "opponent": away if home == team_name else home,
                "home": home == team_name,
                "kickoff": kickoff.isoformat(),
            }
        )

    fixtures.sort(key=lambda f: f["kickoff"])
    return fixtures[:MAX_FIXTURES_PER_TEAM]


def main():
    if len(sys.argv) < 2:
        print("Uso: python scrape_fixtures.py data/raw/mercado_YYYY-MM-DD.json")
        sys.exit(1)

    market_path = Path(sys.argv[1])
    teams = sorted(teams_from_market(market_path))

    calendar_html = fetch_html(CALENDAR_URL)
    slugs = team_slugs(calendar_html)

    today = datetime.now(ZoneInfo("Europe/Madrid")).date()
    by_team = {}
    for i, team in enumerate(teams):
        slug = slugs.get(team)
        if not slug:
            print(f"[aviso] sin slug de URL para '{team}', se omite.")
            continue
        if i > 0:
            time.sleep(REQUEST_DELAY_SECONDS)
        try:
            html = fetch_html(TEAM_FIXTURES_URL.format(slug=slug))
        except requests.RequestException as exc:
            print(f"[aviso] fallo al pedir el calendario de '{team}' ({slug}): {exc}")
            continue
        fixtures = parse_team_fixtures(html, team, today)
        if fixtures:
            by_team[team] = fixtures

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"calendario_{today.isoformat()}.json"
    out_path.write_text(
        json.dumps({"date": today.isoformat(), "fixtures": by_team}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    total = sum(len(f) for f in by_team.values())
    print(f"[ok] {total} partidos de LaLiga para {len(by_team)} equipos guardados en {out_path}")


if __name__ == "__main__":
    main()
