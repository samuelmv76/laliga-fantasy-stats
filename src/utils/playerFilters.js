// Filtros y orden de la lista de jugadores. Viven aquí, y no dentro de un
// componente, porque el Mercado y Mi equipo usan exactamente los mismos.
import { currentPrice, todayDelta } from '../data/mockPlayers.js'
import {
  difficultyBand,
  form,
  fromPeak,
  nextDifficulty,
  pointsAverage,
  pointsPerMillion,
  priceDelta,
} from './playerStats.js'

export const SORTERS = {
  puntos: (a, b) => b.points - a.points,
  media: (a, b) => pointsAverage(b) - pointsAverage(a),
  forma: (a, b) => form(b) - form(a),
  precio: (a, b) => currentPrice(b) - currentPrice(a),
  ratio: (a, b) => pointsPerMillion(b) - pointsPerMillion(a),
  subida: (a, b) => todayDelta(b) - todayDelta(a),
  subida7: (a, b) => priceDelta(b, 7) - priceDelta(a, 7),
  rebaja: (a, b) => fromPeak(a) - fromPeak(b),
}

// Este orden necesita el calendario del equipo, así que no cabe en SORTERS
// (que solo recibe dos jugadores) y se resuelve en sortPlayers().
export const SORT_BY_DIFFICULTY = 'dificultad'

export const SORT_LABELS = {
  puntos: 'puntos',
  media: 'media por partido',
  forma: 'forma (últimas 3 J)',
  precio: 'precio',
  ratio: 'puntos/millón',
  subida: 'subida de hoy',
  subida7: 'subida de 7 días',
  rebaja: 'más lejos de su máximo',
  [SORT_BY_DIFFICULTY]: 'calendario más fácil',
}

export const EMPTY_FILTERS = {
  positions: [],
  teams: [],
  statuses: [],
  difficulties: [],
  minPrice: '',
  maxPrice: '',
  minPoints: '',
  minAverage: '',
  minForm: '',
}

// '' o basura -> null, para poder distinguir "sin filtro" de "filtra por 0".
export function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function countActive(filters) {
  return Object.values(filters).reduce((total, value) => {
    if (Array.isArray(value)) return total + (value.length > 0 ? 1 : 0)
    return total + (numberOrNull(value) === null ? 0 : 1)
  }, 0)
}

// Cuántos jugadores hay por posición y por estado, para el número de cada
// chip. 'total' es la lista entera y 'ok' los que no tienen ninguna baja.
export function filterCounts(players) {
  const counts = { total: players.length }
  for (const player of players) {
    counts[player.pos] = (counts[player.pos] ?? 0) + 1
    const status = player.status ?? 'ok'
    counts[status] = (counts[status] ?? 0) + 1
  }
  return counts
}

// Dificultad media de los próximos partidos, una vez por equipo en vez de
// una vez por jugador.
export function difficultyByTeam(teams, fixtures) {
  const byTeam = {}
  for (const team of teams) byTeam[team] = nextDifficulty(fixtures?.[team])
  return byTeam
}

export function filterPlayers(players, filters, { query = '', difficulty = {} } = {}) {
  const text = query.trim().toLowerCase()
  const minPrice = numberOrNull(filters.minPrice)
  const maxPrice = numberOrNull(filters.maxPrice)
  const minPoints = numberOrNull(filters.minPoints)
  const minAverage = numberOrNull(filters.minAverage)
  const minForm = numberOrNull(filters.minForm)

  return players.filter((player) => {
    if (filters.positions.length > 0 && !filters.positions.includes(player.pos)) return false
    if (filters.teams.length > 0 && !filters.teams.includes(player.team)) return false
    if (filters.statuses.length > 0 && !filters.statuses.includes(player.status ?? 'ok')) return false
    if (filters.difficulties.length > 0) {
      const band = difficultyBand(difficulty[player.team])
      if (band === null || !filters.difficulties.includes(band)) return false
    }

    const price = currentPrice(player) / 1_000_000
    if (minPrice !== null && price < minPrice) return false
    if (maxPrice !== null && price > maxPrice) return false
    if (minPoints !== null && player.points < minPoints) return false
    if (minAverage !== null && pointsAverage(player) < minAverage) return false
    if (minForm !== null && form(player) < minForm) return false

    if (text && !player.name.toLowerCase().includes(text) && !player.team.toLowerCase().includes(text)) {
      return false
    }
    return true
  })
}

export function sortPlayers(players, sortKey, difficulty = {}) {
  if (sortKey === SORT_BY_DIFFICULTY) {
    // Sin calendario, al final: no es "fácil", es que no se sabe.
    const value = (player) => difficulty[player.team] ?? Infinity
    return players.sort((a, b) => value(a) - value(b))
  }
  return players.sort(SORTERS[sortKey])
}
