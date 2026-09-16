# Graph Report - laliga-fantasy  (2026-09-16)

## Corpus Check
- 44 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 280 nodes · 619 edges · 21 communities (18 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Mercado y filtros
- Portada y cabecera
- Fila de jugador
- Fusion del historico
- Ficha y graficas
- Documentacion del scraper
- Estado deportivo
- Cuotas 1X2
- Calendario
- Estadisticas por equipo
- Sincronizacion con Neon
- API y autenticacion
- Modulo 12
- Modulo 13
- Modulo 14
- Modulo 15
- Modulo 16
- Modulo 17
- Modulo 18
- Modulo 19

## God Nodes (most connected - your core abstractions)
1. `Player` - 19 edges
2. `Scraper de precios · LaLiga Fantasy Oficial (futbolfantasy.com)` - 12 edges
3. `TeamView()` - 11 edges
4. `FixturesByTeam` - 11 edges
5. `filterPlayers()` - 10 edges
6. `App()` - 9 edges
7. `PlayerDetail()` - 9 edges
8. `TeamCrest()` - 9 edges
9. `winChance()` - 9 edges
10. `fixtureDifficulty()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `RankingColumn()` --calls--> `formatEuros()`  [EXTRACTED]
  src/components/Ranking.tsx → src/utils/format.tsx
- `TeamView()` --indirect_call--> `formatEurosCompact()`  [INFERRED]
  src/components/TeamView.tsx → src/utils/format.tsx
- `MarketProps` --references--> `FixturesByTeam`  [EXTRACTED]
  src/components/Market.tsx → src/types.tsx
- `MarketProps` --references--> `Player`  [EXTRACTED]
  src/components/Market.tsx → src/types.tsx
- `PlayerDetail()` --indirect_call--> `formatEurosCompact()`  [INFERRED]
  src/components/PlayerDetail.tsx → src/utils/format.tsx

## Import Cycles
- None detected.

## Communities (21 total, 2 thin omitted)

### Community 0 - "Mercado y filtros"
Cohesion: 0.09
Nodes (43): Market(), MarketProps, SORT_KEYS, seasonStats(), COLOR_BY_TONE, PlayerFilters(), PlayerFiltersProps, STATUS_FILTERS (+35 more)

### Community 1 - "Portada y cabecera"
Cohesion: 0.09
Nodes (31): App(), pulseStats(), PlayerDetailProps, PlayerRowProps, Ranking(), RankingColumn(), RankingProps, TeamViewProps (+23 more)

### Community 2 - "Fila de jugador"
Cohesion: 0.13
Nodes (22): BADGE_TONE, DifficultyBars(), PlayerRow(), POS_COLOR, reasonLabel(), StatusBadge(), statusTitle(), StatusUntil() (+14 more)

### Community 3 - "Fusion del historico"
Cohesion: 0.22
Nodes (16): load_canonical(), main(), merge_jornadas(), merge_market(), merge_points(), merge_stats(), merge_status(), Path (+8 more)

### Community 4 - "Ficha y graficas"
Cohesion: 0.28
Nodes (12): cumulativeByMatchday(), PlayerDetail(), STATUS_BANNER, TeamDailyBars(), TeamValueChart(), chartDay(), chartEuros(), formatDay() (+4 more)

### Community 5 - "Documentacion del scraper"
Cohesion: 0.14
Nodes (13): Automatización (gratis), Cadena completa de un día, Calendario / próximos partidos, Conectar con el front, Cuotas 1X2 (probabilidad de victoria y dificultad), Estado deportivo (lesión / duda / sanción), Estadísticas reales (minutos, goles, asistencias, tarjetas), Lo que falta por hacer (30–60 min con el navegador abierto) (+5 more)

### Community 6 - "Estado deportivo"
Cohesion: 0.28
Nodes (12): fetch_html(), main(), note(), parse_injured(), parse_suspended(), play_probability(), player_id(), Scraper de estado deportivo (lesión / duda / sanción) en futbolfantasy.com QUÉ… (+4 more)

### Community 7 - "Cuotas 1X2"
Cohesion: 0.31
Nodes (10): canonical_team(), main(), normalize(), parse_kickoff(), parse_odds(), Path, Cuotas 1X2 de los próximos partidos de LaLiga. FUENTE ------…, Nombre tal y como lo usa el mercado, si se reconoce; si no, el original. (+2 more)

### Community 8 - "Calendario"
Cohesion: 0.33
Nodes (9): fetch_html(), main(), parse_kickoff(), parse_team_fixtures(), Path, Scraper del calendario de LaLiga Fantasy Oficial en futbolfantasy.com QUÉ HACE…, Nombre de equipo (como aparece en el mercado) -> slug de su URL., team_slugs() (+1 more)

### Community 9 - "Estadisticas por equipo"
Cohesion: 0.33
Nodes (9): column_indexes(), fetch_html(), main(), _number_or_none(), parse_team(), player_id(), Scraper de estadísticas reales (minutos, goles, asistencias, tarjetas…) en…, {'minutes': '2', 'goals': '3', ...} leído de la cabecera de la tabla. (+1 more)

### Community 10 - "Sincronizacion con Neon"
Cohesion: 0.44
Nodes (9): __dirname, main(), readJson(), sql, syncFixtures(), syncMatchdayPoints(), syncPlayers(), syncPointsHistory() (+1 more)

### Community 11 - "API y autenticacion"
Cohesion: 0.54
Nodes (6): clerkClient, getClerkUserId(), ensureUserAndTeam(), getSquadIds(), handler(), sql

### Community 12 - "Modulo 12"
Cohesion: 0.43
Nodes (7): attach_odds(), main(), normalize(), odds_index(), Path, Publica el scrape del calendario (data/raw/calendario_YYYY-MM-DD.json, ya…, {(local, visitante, fecha): odds} con los nombres ya normalizados.

### Community 13 - "Modulo 13"
Cohesion: 0.53
Nodes (5): fetch_html(), _int_or_none(), main(), parse_table(), Scraper del mercado de LaLiga Fantasy Oficial en futbolfantasy.com QUÉ HACE…

### Community 14 - "Modulo 14"
Cohesion: 0.53
Nodes (5): fetch_html(), _int_or_none(), main(), parse_table(), Scraper de puntos de LaLiga Fantasy Oficial en futbolfantasy.com Lee el total…

### Community 15 - "Modulo 15"
Cohesion: 0.60
Nodes (4): fetch_html(), main(), parse_matchday_points(), Scraper de puntos por jornada de LaLiga Fantasy Oficial en futbolfantasy.com…

### Community 16 - "Modulo 16"
Cohesion: 0.70
Nodes (4): hueFromName(), initials(), slugify(), TeamCrest()

### Community 17 - "Modulo 17"
Cohesion: 1.00
Nodes (3): handler(), legacyPlayers(), sql

## Knowledge Gaps
- **33 isolated node(s):** `SORT_KEYS`, `STATUS_BANNER`, `COLOR_BY_TONE`, `STATUS_FILTERS`, `POS_COLOR` (+28 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 68 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Player` connect `Portada y cabecera` to `Mercado y filtros`, `Fila de jugador`, `Ficha y graficas`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `TeamCrest()` connect `Modulo 16` to `Mercado y filtros`, `Portada y cabecera`, `Fila de jugador`, `Ficha y graficas`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `FixturesByTeam` connect `Portada y cabecera` to `Mercado y filtros`, `Ficha y graficas`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `SORT_KEYS`, `STATUS_BANNER`, `COLOR_BY_TONE` to the rest of the system?**
  _33 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Mercado y filtros` be split into smaller, more focused modules?**
  _Cohesion score 0.09147869674185463 - nodes in this community are weakly interconnected._
- **Should `Portada y cabecera` be split into smaller, more focused modules?**
  _Cohesion score 0.08859357696567 - nodes in this community are weakly interconnected._
- **Should `Fila de jugador` be split into smaller, more focused modules?**
  _Cohesion score 0.12962962962962962 - nodes in this community are weakly interconnected._