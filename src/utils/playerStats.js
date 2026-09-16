// Estadísticas derivadas de lo que ya trae cada jugador (precio, puntos por
// jornada, partidos jugados) y de su calendario. Todo son funciones puras
// para poder usarlas igual en filtros, orden y ficha de jugador.
import { currentPrice } from '../data/mockPlayers.js'
import { fixtureDifficulty } from './opponent.js'

// Partidos jugados de verdad. El scraper publica `played`; con los datos de
// prueba no existe, así que se aproxima con las jornadas que tienen
// puntuación (que es justo lo que el desglose por jornada guarda).
export function matchesPlayed(player) {
  return player.played ?? player.pointsByMatchday?.length ?? 0
}

// Media de puntos por partido jugado. Es la comparación justa entre un
// jugador que lleva 5 jornadas y otro que acaba de llegar al equipo.
export function pointsAverage(player) {
  const played = matchesPlayed(player)
  return played > 0 ? player.points / played : 0
}

// Forma: puntos sumados en las últimas `matchdays` jornadas con datos.
export function form(player, matchdays = 3) {
  const recent = (player.pointsByMatchday ?? []).slice(-matchdays)
  return recent.reduce((sum, m) => sum + m.points, 0)
}

export function pointsPerMillion(player) {
  const price = currentPrice(player)
  return price > 0 ? player.points / (price / 1_000_000) : 0
}

// Variación de precio respecto a `days` puntos atrás del historial.
// atajo: cuenta puntos del historial, no días de calendario — el scraper
// salta días sin mercado, así que "7" son las 7 últimas lecturas. Revisar
// si algún día el historial pasa a tener un punto por día garantizado.
export function priceDelta(player, days = 1) {
  const history = player.priceHistory ?? []
  if (history.length < 2) return 0
  const past = history[Math.max(0, history.length - 1 - days)]
  return currentPrice(player) - past.price
}

// Distancia al máximo histórico, en tanto por uno y negativa (-0.12 = está
// un 12% por debajo de su pico). Sirve para buscar jugadores "rebajados".
export function fromPeak(player) {
  const history = player.priceHistory ?? []
  if (history.length === 0) return 0
  const peak = Math.max(...history.map((h) => h.price))
  return peak > 0 ? currentPrice(player) / peak - 1 : 0
}

// Dificultad media (1 fácil … 5 muy difícil) de los próximos `count`
// partidos del equipo. null si no hay calendario para ese equipo.
export function nextDifficulty(teamFixtures, count = 3) {
  const next = (teamFixtures ?? []).slice(0, count)
  if (next.length === 0) return null
  return next.reduce((sum, f) => sum + fixtureDifficulty(f), 0) / next.length
}

// Tres tramos para filtrar por calendario sin pedir un número exacto.
export const DIFFICULTY_BANDS = [
  { id: 'facil', label: 'Fácil', max: 2.5 },
  { id: 'media', label: 'Media', max: 3.5 },
  { id: 'dificil', label: 'Difícil', max: Infinity },
]

export function difficultyBand(difficulty) {
  if (difficulty == null) return null
  return DIFFICULTY_BANDS.find((band) => difficulty <= band.max).id
}
