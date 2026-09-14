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

export const FIXTURES = Object.fromEntries(
  TEAMS.map((team, teamIndex) => [
    team,
    NEXT_MATCHDAYS.map((matchday, i) => {
      const opponent = TEAMS[(teamIndex + i + 1) % TEAMS.length]
      return {
        matchday,
        opponent,
        home: (teamIndex + i) % 2 === 0,
        kickoff: kickoffFor(i, teamIndex),
      }
    }),
  ]),
)
