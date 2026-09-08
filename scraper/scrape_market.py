"""
Scraper del mercado de LaLiga Fantasy Oficial en futbolfantasy.com

QUÉ HACE
--------
Descarga la página de mercado (precios actuales + variación de 1, 2, 3, 7,
14 y 30 días) y la deja como una lista de dicts en JSON, un fichero por
ejecución: data/raw/mercado_YYYY-MM-DD.json

CÓMO ENCONTRAR LOS DATOS EN LA PÁGINA (dos estrategias, en este orden)
-----------------------------------------------------------------------
1) JSON embebido: muchas páginas con tablas filtrables (por equipo, posición,
   rango de precio) cargan TODO el dataset en un <script> como un array/objeto
   JS, y filtran en el navegador sin volver a pedir nada al servidor. Es lo
   más robusto de parsear porque no depende de clases CSS.

2) Fallback: si no se encuentra ese bloque, se cae a leer la tabla HTML
   directamente con BeautifulSoup.

>>> ANTES DE USARLO EN SERIO <<<
Abre la página en el navegador:
  https://www.futbolfantasy.com/analytics/laliga-fantasy/mercado
Botón derecho -> "Ver código fuente" (no "Inspeccionar", queremos el HTML
crudo que manda el servidor) y busca (Ctrl+F) el nombre de un jugador
conocido, p.ej. "Sivera". Si aparece dentro de un <script>, copia el nombre
de la variable JS en JSON_VAR_CANDIDATES de abajo. Si aparece dentro de un
<td> o <tr>, la tabla se scrapea directamente y hay que ajustar los
selectores en `parse_table()`.
"""

import json
import re
import sys
from datetime import date, datetime, timezone
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

# Nombres de variable JS candidatos donde podría vivir el dataset embebido.
# Añade aquí el que encuentres mirando el código fuente (ver docstring).
JSON_VAR_CANDIDATES = ["jugadores", "players", "data", "mercado", "tableData"]

OUT_DIR = Path(__file__).parent / "data" / "raw"


def fetch_html(url: str) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.text


def try_extract_embedded_json(html: str):
    """Busca `var <nombre> = [...];` o `= {...};` para cada candidato."""
    for name in JSON_VAR_CANDIDATES:
        pattern = rf"(?:var|let|const)\s+{name}\s*=\s*(\[.*?\]|\{{.*?\}})\s*;"
        match = re.search(pattern, html, re.DOTALL)
        if not match:
            continue
        raw = match.group(1)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # JS no siempre es JSON válido (comillas simples, trailing
            # commas...). Si pasa esto, imprime `raw[:500]` para depurar
            # a mano en vez de seguir a ciegas.
            print(f"[aviso] variable '{name}' encontrada pero no es JSON "
                  f"válido tal cual; revisa manualmente.", file=sys.stderr)
            continue
    return None


def parse_money(text: str) -> int | None:
    """'42.511.625' -> 42511625. Vacío/():'' -> None."""
    if text is None:
        return None
    cleaned = text.strip().replace(".", "").replace("€", "")
    if cleaned in ("", "-"):
        return None
    try:
        return int(cleaned)
    except ValueError:
        return None


def parse_table(html: str):
    """Fallback: lee la tabla HTML directamente si no hay JSON embebido.

    AJUSTA ESTO tras inspeccionar la tabla real (botón derecho -> Inspeccionar
    sobre una fila). Aquí se asume la estructura más común: una tabla con
    <tbody><tr><td>...</td>...</tr></tbody>, con el nombre del jugador en el
    primer <td> (a veces dentro de un <a>) y el resto de columnas en el
    mismo orden en que aparecen visualmente en la web.
    """
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")
    if table is None:
        raise RuntimeError(
            "No se encontró ninguna <table> en la página. "
            "Lo más probable es que el dataset esté embebido como JSON: "
            "revisa try_extract_embedded_json() y JSON_VAR_CANDIDATES."
        )

    rows = table.select("tbody tr")
    players = []
    for tr in rows:
        cells = [td.get_text(strip=True) for td in tr.find_all("td")]
        if not cells:
            continue

        name_cell = tr.find("a")
        name = name_cell.get_text(strip=True) if name_cell else cells[0]

        # Extrae todas las cantidades tipo "42.511.625" de la fila; las
        # últimas 7 (según lo observado en la web) son: precio actual,
        # -1d, -2d, -3d, -7d, -14d, -30d.
        money_values = [c for c in cells if re.fullmatch(r"-?\d[\d.]*", c)]
        prices = [parse_money(v) for v in money_values[-7:]]

        players.append({
            "name": name,
            "raw_cells": cells,  # de momento guarda todo; recorta cuando
                                   # confirmes qué columna es cuál
            "prices_last7_snapshots": prices,
        })
    return players


def normalize_from_json(raw_data):
    """Adapta el JSON embebido (si lo hay) a nuestro formato.

    La forma exacta de `raw_data` depende de lo que encuentres: puede ser
    una lista de dicts ya con claves como "nombre", "valor", etc. Ajusta
    este mapeo una vez sepas qué claves trae.
    """
    normalized = []
    for item in raw_data:
        normalized.append({
            "name": item.get("nombre") or item.get("name"),
            "team": item.get("equipo") or item.get("team"),
            "slug": item.get("slug") or item.get("url"),
            "price": item.get("valor") or item.get("value") or item.get("precio"),
            "raw": item,  # conserva el original por si faltan campos
        })
    return normalized


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    html = fetch_html(MARKET_URL)

    embedded = try_extract_embedded_json(html)
    if embedded is not None:
        print("[info] dataset embebido encontrado, usando JSON directo.")
        players = normalize_from_json(embedded)
    else:
        print("[info] no se encontró JSON embebido, usando fallback de tabla HTML.")
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
