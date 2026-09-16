# LaLiga Fantasy · Estadísticas

Cada precio de LaLiga Fantasy, día a día.

Una aplicación web que sigue el mercado de LaLiga Fantasy Oficial: precio de los 656 jugadores, puntos por jornada, minutos, lesiones y sanciones, y la dificultad real del próximo rival calculada desde las cuotas de las casas de apuestas.

---

## Lo que hace

**Mercado.** Los jugadores de la liga con su precio, su histórico de 30 días, los puntos por millón y el próximo rival. Filtros combinables por posición, equipo, estado deportivo, precio, rendimiento mínimo y dificultad de calendario.

**Mi equipo.** Hasta 25 jugadores seguidos, guardados en tu cuenta. Valor total, ganancia diaria y los mismos filtros que el mercado.

**Ficha del jugador.** Evolución del precio, puntos acumulados por jornada, estadísticas reales de la temporada y los próximos partidos con su probabilidad de victoria.

**Ranking del día.** Quién sube y quién baja, ordenado por variación.

---

## Cómo está hecho

```
scraper/          Python · recoge los datos cada noche
  ↓
Neon Postgres     sync_to_neon.mjs publica el fichero canónico
  ↓
api/              Funciones de Vercel · /api/players, /api/fixtures, /api/teams
  ↓
src/              React 19 · TypeScript · Tailwind v4
```

### El front

React 19 con TypeScript en modo estricto y Tailwind v4. Los tokens de diseño viven en variables CSS y se exponen a Tailwind con `@theme inline`, así que el tema claro y oscuro es un atributo en `<html>`, no dos juegos de clases.

El centro de todo es `src/types.tsx`: el tipo `Player` es el nodo más conectado del proyecto — 19 módulos lo referencian. Casi todos sus campos son opcionales a propósito, porque vienen de un scraper y el front tiene que aguantar que falten.

| Módulo | Responsabilidad |
|---|---|
| `components/Market.tsx` | La tabla del mercado |
| `components/TeamView.tsx` | La plantilla seguida y sus gráficas |
| `components/PlayerFilters.tsx` | La barra de filtros, compartida por las dos vistas |
| `components/PlayerDetail.tsx` | La ficha del jugador |
| `utils/playerFilters.tsx` | Filtrado y orden, sin React |
| `utils/playerStats.tsx` | Media, forma, variación de precio, dificultad |
| `utils/opponent.tsx` | Cuotas 1X2 → probabilidad de victoria → dificultad |
| `utils/matchday.tsx` | Cuándo empieza y acaba la jornada |

Mercado y Mi equipo comparten la misma lógica de filtrado: las tres dependencias más fuertes del grafo del proyecto son `Market → playerFilters`, `PlayerFilters → playerFilters` y `TeamView → playerFilters`.

### Los datos

El scraper lee futbolfantasy.com y football-data.co.uk, y deja un fichero canónico por jugador:

| Script | Qué trae |
|---|---|
| `scrape_market.py` | Precio de hoy y de hace 1, 2, 3, 7, 14 y 30 días |
| `scrape_points.py` | Puntos de temporada y partidos jugados |
| `scrape_matchday_points.py` | Desglose por jornada |
| `scrape_status.py` | Lesión, duda o sanción, con su duración |
| `scrape_stats.py` | Minutos, goles, asistencias, tarjetas, paradas |
| `scrape_fixtures.py` | Calendario real por equipo |
| `scrape_odds.py` | Cuotas 1X2 del próximo partido |

`merge_history.py` los fusiona en `scraper/data/jugadores.json` de forma idempotente, y `sync_to_neon.mjs` lo publica en Neon. Un GitHub Action lo ejecuta cada noche.

La dificultad del rival no es una opinión: sale de las cuotas 1X2, se le quita el margen de la casa y se normaliza a una probabilidad de victoria. Sin cuotas, el front cae a una estimación y lo dice en el tooltip.

---

## Desarrollo

```bash
npm install
npm run dev
```

En desarrollo no hay funciones de Vercel, así que `vite.config.ts` sirve los JSON del scraper en `/api/players` y `/api/fixtures` con el mismo filtro de partidos futuros que la consulta real. La app arranca con los datos de verdad, sin desplegar nada.

```bash
npm run typecheck    # tsc --noEmit
npm test             # vitest
npm run lint         # oxlint
npm run build
```

### Variables de entorno

| Variable | Dónde | Para qué |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `.env` | Sesión en el navegador |
| `CLERK_SECRET_KEY` | `.env` | Verificación del token en la API |
| `DATABASE_URL` | `.env.local` | Neon Postgres |

### El scraper

```bash
pip install -r scraper/requirements.txt
python scraper/scrape_market.py
python scraper/scrape_points.py
python scraper/scrape_status.py
python scraper/scrape_stats.py
python merge_history.py data/raw/mercado_*.json data/raw/puntos_*.json \
                        data/raw/estadisticas_*.json data/raw/estado_*.json
DATABASE_URL=postgres://... node scraper/sync_to_neon.mjs
```

En `scraper/README.md` está el detalle de cada scraper y de qué hacer cuando la web de origen cambia de estructura.

---

## Licencia y datos

Proyecto personal, sin relación con LaLiga ni con futbolfantasy.com. Los datos se obtienen de páginas públicas y se usan para seguimiento propio.
