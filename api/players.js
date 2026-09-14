import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

// Misma forma que el antiguo public/jugadores.json: un array de jugadores
// con su histórico de precios y puntos ya anidado (agregado en la propia
// consulta para no hacer N+1 desde el front).
export default async function handler(req, res) {
  try {
    const players = await sql`
      SELECT
        p.id, p.name, p.team, p.pos, p.points,
        COALESCE(price.hist, '[]'::json) AS "priceHistory",
        COALESCE(pts.hist, '[]'::json) AS "pointsHistory",
        COALESCE(md.hist, '[]'::json) AS "pointsByMatchday"
      FROM players p
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object('date', price_date, 'price', price) ORDER BY price_date) AS hist
        FROM player_price_history WHERE player_id = p.id
      ) price ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object('date', points_date, 'points', points) ORDER BY points_date) AS hist
        FROM player_points_history WHERE player_id = p.id
      ) pts ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object('matchday', matchday, 'points', points) ORDER BY matchday) AS hist
        FROM player_matchday_points WHERE player_id = p.id
      ) md ON true
      ORDER BY p.team, p.name
    `
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
    res.status(200).json(players)
  } catch (error) {
    console.error('Error en /api/players:', error)
    res.status(500).json({ error: 'error-servidor' })
  }
}
