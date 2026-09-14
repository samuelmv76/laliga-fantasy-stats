# Scraper de precios · LaLiga Fantasy Oficial (futbolfantasy.com)

## Lo que ya sabemos (confirmado)

La página de mercado se puede leer con una petición HTTP normal, sin
navegador:

```
https://www.futbolfantasy.com/analytics/laliga-fantasy/mercado
```

Cada jugador trae, en la misma carga:
- Precio **actual**
- Precio de hace **1, 2, 3, 7, 14 y 30 días**
- Nombre, equipo, próximo rival

Es decir: un solo scrape ya te da 7 puntos de histórico, no solo el del
día. Eso es una ventaja grande para arrancar el proyecto con datos reales
desde el primer día, en vez de esperar 14 noches a acumular histórico.

## Lo que falta por hacer (30–60 min con el navegador abierto)

`scrape_market.py` está montado con dos estrategias y necesita que **tú**
confirmes cuál aplica, porque yo no tengo acceso a un navegador con sesión
a esa web desde aquí:

1. Abre la URL de arriba en tu navegador.
2. Botón derecho → **"Ver código fuente de la página"** (¡no
   "Inspeccionar"! Queremos el HTML que manda el servidor, no el DOM ya
   procesado).
3. Busca (Ctrl+F) el nombre de un jugador que hayas visto en el mercado,
   por ejemplo `Sivera`.
   - **Si aparece dentro de un `<script>`**, casi seguro que todo el
     dataset viaja como un array/objeto JavaScript embebido (muy típico en
     tablas con filtros instantáneos como esta, que filtra por equipo,
     posición y rango de precio sin recargar). Copia el nombre de la
     variable (`var jugadores = [...]`, `const data = [...]`, etc.) en
     `JSON_VAR_CANDIDATES` dentro de `scrape_market.py`, y ajusta
     `normalize_from_json()` con las claves reales una vez veas el JSON
     (imprímelo con `print(embedded[0])` para ver las claves).
   - **Si aparece dentro de un `<td>`**, la tabla se manda ya renderizada
     y toca ajustar `parse_table()` con los selectores reales.
4. Ejecuta `python scrape_market.py` y revisa
   `data/raw/mercado_<fecha>.json` — si el resultado tiene pinta rara,
   repite el paso 3 con más calma.

## Uso normal (una vez ajustado)

```bash
pip install -r requirements.txt
python scrape_market.py                              # guarda el snapshot de hoy
python merge_history.py data/raw/mercado_2026-09-08.json   # lo acumula en data/jugadores.json
```

`data/jugadores.json` es el fichero canónico: cada vez que lo fusionas,
añade un punto más a `priceHistory` de cada jugador (nunca lo pisa, salvo
que ejecutes dos veces el mismo día, que entonces sustituye el de hoy).

## Calendario / próximos partidos

`scrape_fixtures.py` **no** usa la página general de calendario para leer
los partidos: esa página reutiliza un widget de pestañas genérico
compartido por varias competiciones, y el número de "jornada" que se lee
ahí es solo la posición de la pestaña, no la jornada real de LaLiga
(comprobado a mano contra el HTML — daba resultados incoherentes). Solo se
usa esa página para sacar el mapa equipo -> slug de URL.

En su lugar pide la ficha de partidos de cada equipo
(`/laliga/equipos/<slug>/partidos`), que trae el calendario completo de la
temporada con la jornada real y la competición explícitas en cada partido
— así que son ~20 peticiones (una por equipo, con pausa entre ellas) en
vez de 1:

```bash
python scrape_market.py
python scrape_fixtures.py data/raw/mercado_2026-09-14.json
python scrape_odds.py data/raw/mercado_2026-09-14.json         # -> data/raw/cuotas_*.json
python build_calendar.py data/raw/calendario_2026-09-14.json data/raw/cuotas_2026-09-14.json
```

Guarda hasta 6 próximos partidos de LaLiga por equipo (el front muestra
los que haya, mínimo pensado para 4).

### Cuotas 1X2 (probabilidad de victoria y dificultad)

`scrape_odds.py` baja `https://www.football-data.co.uk/fixtures.csv` (CSV
plano, sin API key) y se queda con las filas `Div == SP1`. Usa las cuotas
medias del mercado (`AvgH/AvgD/AvgA`), con Bet365 y la máxima como
alternativas, y traduce los nombres de equipo a los del mercado fantasy
(`TEAM_ALIASES`).

`build_calendar.py` las pega a cada partido como `odds` y el front
(`src/utils/opponent.js`) quita el margen de la casa —las probabilidades
implícitas se normalizan para que sumen 100%— y de ahí salen el porcentaje
de victoria y la dificultad del rival (1 fácil … 5 muy difícil). Sin cuotas
para un partido, el front cae a una estimación por dificultad.

Ojo: football-data solo publica en `fixtures.csv` los partidos de los
próximos días, así que lo normal es que solo la jornada más cercana traiga
cuotas; el resto se rellena en la siguiente ejecución.

`sync_to_neon.mjs` crea las columnas `odds_home/odds_draw/odds_away` en
`team_fixtures` (`ADD COLUMN IF NOT EXISTS`) y `/api/fixtures` las sirve
dentro de `odds`. Comprobación rápida del cálculo:

```bash
node ../src/utils/opponent.test.mjs
```

A diferencia de `jugadores.json`, `calendario.json` no acumula histórico:
cada ejecución lo sustituye entero (solo interesan los partidos por jugar).
Formato, uno por equipo:

```json
{
  "Real Madrid": [
    { "matchday": 6, "opponent": "Elche", "home": false, "kickoff": "2026-09-15T21:30:00+02:00" }
  ]
}
```

El front lo consume vía `src/hooks/useFixtures.js` (mismo patrón que
`usePlayers`: intenta `/calendario.json`, si no existe usa
`src/data/mockFixtures.js`).

## Automatización (gratis)

`.github/workflows/update-prices.yml` ya está listo: corre cada noche vía
GitHub Actions (gratis en repos públicos y en la mayoría de casos de uso
personal en privados), ejecuta el scraper, fusiona el histórico y hace
commit + push de `data/jugadores.json` — copiándolo también a
`laliga-fantasy/public/jugadores.json` para que el front lo sirva como
estático. Ajusta la hora del cron si tu scrape necesita más margen tras la
medianoche española.

## Conectar con el front

El proyecto de React ya está preparado: `src/hooks/usePlayers.js` intenta
cargar `/jugadores.json` al arrancar, y si no existe (por ejemplo, en
desarrollo antes de tener el scraper funcionando) usa los datos de prueba
de `mockPlayers.js` automáticamente. En cuanto `jugadores.json` exista en
`public/`, el front lo usa sin tocar nada más.

## Pendiente para más adelante (no bloquea el lanzamiento)

- **Puntos**: esta página de mercado no trae puntos, solo precio. Hay una
  página separada de puntos en futbolfantasy.com — se puede cruzar por
  `slug` del jugador en una segunda pasada del scraper cuando quieras
  añadirlo.
- **Posición** (POR/DEF/MID/DEL): tampoco viene en la tabla de mercado tal
  como la vimos; probablemente haya que sacarla del desplegable de
  filtro (que scrapea por posición aparte) o de la ficha individual de
  cada jugador (`/jugadores/<slug>`).
