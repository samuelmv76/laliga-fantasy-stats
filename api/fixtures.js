import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

// Misma forma que el antiguo public/calendario.json: un objeto por equipo
// con sus próximos partidos.
export default async function handler(req, res) {
  try {
    const rows = await sql`
      SELECT team, matchday, opponent, home, kickoff
      FROM team_fixtures
      WHERE kickoff > now()
      ORDER BY team, kickoff
    `
    const byTeam = {}
    for (const { team, ...fixture } of rows) {
      ;(byTeam[team] ??= []).push(fixture)
    }
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
    res.status(200).json(byTeam)
  } catch (error) {
    console.error('Error en /api/fixtures:', error)
    res.status(500).json({ error: 'error-servidor' })
  }
}
