// Calendario de prueba: próximos 3 partidos por equipo, deterministas (mismo
// patrón que mockPlayers.js), en el mismo formato que publicará el scraper
// real en /calendario.json.
import { TEAMS } from './mockPlayers'

const NEXT_MATCHDAYS = [6, 7, 8, 9]
const REFERENCE_KICKOFF = new Date('2026-09-20T21:00:00+02:00')

function kickoffFor(matchdayIndex, teamIndex) {
  const d = new Date(REFERENCE_KICKOFF)
  d.setDate(d.getDate() + matchdayIndex * 7 + (teamIndex % 3))
  d.setHours(16 + ((teamIndex + matchdayIndex) % 3) * 2, teamIndex % 2 === 0 ? 0 : 30)
  return d.toISOString()
}

// Cuotas 1X2 de prueba, con el margen típico de casa (~6%), en el mismo
// formato que publica scrape_odds.py desde football-data.co.uk.
function mockOdds(difficulty, home) {
  const win = [0.62, 0.52, 0.42, 0.33, 0.25][difficulty - 1] + (home ? 0.05 : -0.05)
  const draw = 0.25
  const margin = 1.06
  const round = (p) => Math.round((1 / (p * margin)) * 100) / 100
  return { home: round(home ? win : 1 - win - draw), draw: round(draw), away: round(home ? 1 - win - draw : win) }
}

export const FIXTURES = Object.fromEntries(
  TEAMS.map((team, teamIndex) => [
    team,
    NEXT_MATCHDAYS.map((matchday, i) => {
      const opponent = TEAMS[(teamIndex + i + 1) % TEAMS.length]
      const home = (teamIndex + i) % 2 === 0
      const difficulty = 1 + ((teamIndex * 13 + i * 7) % 5) // 1 (fácil) a 5 (muy difícil)
      return {
        matchday,
        opponent,
        home,
        kickoff: kickoffFor(i, teamIndex),
        difficulty,
        odds: mockOdds(difficulty, home),
      }
    }),
  ]),
)
