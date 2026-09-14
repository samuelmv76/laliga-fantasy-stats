// Sube los ficheros canónicos del scraper (data/jugadores.json,
// data/calendario.json) a Neon, para que el front los sirva vía
// /api/players y /api/fixtures en vez de JSON estático.
//
// jugadores.json/calendario.json siguen generándose igual (merge_history.py
// / build_calendar.py) y siguen siendo la fuente de verdad local; este
// script solo los publica en la base de datos.
//
// Uso:
//   DATABASE_URL=postgres://... node sync_to_neon.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { neon } from '@neondatabase/serverless'

const __dirname = dirname(fileURLToPath(import.meta.url))

if (!process.env.DATABASE_URL) {
  console.error('[error] falta DATABASE_URL en el entorno.')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(__dirname, relativePath), 'utf-8'))
}

async function syncPlayers(players) {
  await sql`
    INSERT INTO players (id, name, team, pos, points, updated_at)
    SELECT * FROM UNNEST(
      ${players.map((p) => p.id)}::text[],
      ${players.map((p) => p.name)}::text[],
      ${players.map((p) => p.team)}::text[],
      ${players.map((p) => p.pos)}::text[],
      ${players.map((p) => p.points)}::int[],
      ${players.map(() => new Date().toISOString())}::timestamptz[]
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      team = EXCLUDED.team,
      pos = EXCLUDED.pos,
      points = EXCLUDED.points,
      updated_at = EXCLUDED.updated_at
  `
  console.log(`[ok] players: ${players.length} filas sincronizadas.`)
}

async function syncPriceHistory(players) {
  const ids = [],
    dates = [],
    prices = []
  for (const p of players) {
    for (const h of p.priceHistory || []) {
      ids.push(p.id)
      dates.push(h.date)
      prices.push(h.price)
    }
  }
  if (ids.length === 0) return
  await sql`
    INSERT INTO player_price_history (player_id, price_date, price)
    SELECT * FROM UNNEST(${ids}::text[], ${dates}::date[], ${prices}::numeric[])
    ON CONFLICT (player_id, price_date) DO UPDATE SET price = EXCLUDED.price
  `
  console.log(`[ok] player_price_history: ${ids.length} filas sincronizadas.`)
}

async function syncPointsHistory(players) {
  const ids = [],
    dates = [],
    points = []
  for (const p of players) {
    for (const h of p.pointsHistory || []) {
      ids.push(p.id)
      dates.push(h.date)
      points.push(h.points)
    }
  }
  if (ids.length === 0) return
  await sql`
    INSERT INTO player_points_history (player_id, points_date, points)
    SELECT * FROM UNNEST(${ids}::text[], ${dates}::date[], ${points}::int[])
    ON CONFLICT (player_id, points_date) DO UPDATE SET points = EXCLUDED.points
  `
  console.log(`[ok] player_points_history: ${ids.length} filas sincronizadas.`)
}

async function syncMatchdayPoints(players) {
  const ids = [],
    matchdays = [],
    points = []
  for (const p of players) {
    for (const md of p.pointsByMatchday || []) {
      ids.push(p.id)
      matchdays.push(md.matchday)
      points.push(md.points)
    }
  }
  if (ids.length === 0) return
  await sql`
    INSERT INTO player_matchday_points (player_id, matchday, points)
    SELECT * FROM UNNEST(${ids}::text[], ${matchdays}::int[], ${points}::int[])
    ON CONFLICT (player_id, matchday) DO UPDATE SET points = EXCLUDED.points
  `
  console.log(`[ok] player_matchday_points: ${ids.length} filas sincronizadas.`)
}

async function syncFixtures(calendario) {
  const teams = [],
    matchdays = [],
    opponents = [],
    homes = [],
    kickoffs = []
  for (const [team, fixtures] of Object.entries(calendario)) {
    for (const f of fixtures) {
      teams.push(team)
      matchdays.push(f.matchday)
      opponents.push(f.opponent)
      homes.push(f.home)
      kickoffs.push(f.kickoff)
    }
  }
  // El calendario no acumula histórico (solo próximos partidos), así que
  // se sustituye entero en vez de acumularse, igual que build_calendar.py.
  await sql.transaction([
    sql`DELETE FROM team_fixtures`,
    ...(teams.length > 0
      ? [
          sql`
            INSERT INTO team_fixtures (team, matchday, opponent, home, kickoff)
            SELECT * FROM UNNEST(
              ${teams}::text[],
              ${matchdays}::int[],
              ${opponents}::text[],
              ${homes}::boolean[],
              ${kickoffs}::timestamptz[]
            )
          `,
        ]
      : []),
  ])
  console.log(`[ok] team_fixtures: ${teams.length} filas sincronizadas.`)
}

async function main() {
  const players = readJson('data/jugadores.json')
  const calendario = readJson('data/calendario.json')

  await syncPlayers(players)
  await syncPriceHistory(players)
  await syncPointsHistory(players)
  await syncMatchdayPoints(players)
  await syncFixtures(calendario)
}

main().catch((error) => {
  console.error('[error] sync_to_neon falló:', error)
  process.exit(1)
})
