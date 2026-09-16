// Probabilidad de victoria y dificultad del rival a partir de las cuotas 1X2
// de las casas de apuestas (media del mercado, football-data.co.uk).
//
// El calendario trae `odds: { home, draw, away }` en formato decimal europeo.
// Las cuotas llevan el margen de la casa incorporado (la suma de las
// probabilidades implícitas pasa del 100%), así que se normalizan de forma
// proporcional antes de usarlas. Si un partido no tiene cuotas se cae a una
// estimación por dificultad, para que la tabla nunca quede coja.

import type { Fixture, Odds } from '../types.tsx'

const DIFFICULTY_COLOR = ['#30d158', '#a2d93a', '#ffd60a', '#ff9f0a', '#ff453a']

// Victoria estimada por dificultad cuando no hay cuotas (1 fácil … 5 difícil).
const WIN_BY_DIFFICULTY = [72, 62, 50, 38, 27]

// Umbrales de probabilidad de victoria -> dificultad 1..5.
const DIFFICULTY_THRESHOLDS = [60, 50, 40, 30]

function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h
}

function validOdd(value: unknown): number | null {
  const odd = Number(value)
  // Una cuota decimal siempre es > 1 (y por encima de ~100 es ruido, no mercado).
  return Number.isFinite(odd) && odd > 1 && odd < 1000 ? odd : null
}

// Probabilidades implícitas 1X2 sin el margen de la casa, o null si las
// cuotas no sirven.
export function impliedProbabilities(odds: Partial<Odds> | undefined | null) {
  const home = validOdd(odds?.home)
  const draw = validOdd(odds?.draw)
  const away = validOdd(odds?.away)
  if (!home || !draw || !away) return null

  const raw: [number, number, number] = [1 / home, 1 / draw, 1 / away]
  const overround = raw[0] + raw[1] + raw[2]
  if (!(overround > 0)) return null
  return { home: raw[0] / overround, draw: raw[1] / overround, away: raw[2] / overround }
}

// Porcentaje entero (0-100) de que gane el equipo del jugador.
export function winChance(fixture?: Fixture | null): number {
  const probabilities = impliedProbabilities(fixture?.odds)
  if (probabilities) {
    return Math.round((fixture?.home ? probabilities.home : probabilities.away) * 100)
  }

  const given = Number(fixture?.winChance)
  if (Number.isFinite(given) && given >= 0 && given <= 100) return Math.round(given)

  const base = WIN_BY_DIFFICULTY[fallbackDifficulty(fixture) - 1]
  return Math.min(95, Math.max(5, base + (fixture?.home ? 6 : -6)))
}

function fallbackDifficulty(fixture?: Fixture | null): number {
  const given = Number(fixture?.difficulty)
  if (Number.isInteger(given) && given >= 1 && given <= 5) return given
  if (!fixture?.opponent) return 3
  return 1 + (hash(fixture.opponent) % 5)
}

// Dificultad 1 (fácil) … 5 (muy difícil). Con cuotas sale de la probabilidad
// de victoria real; sin ellas, del campo `difficulty` del calendario.
export function fixtureDifficulty(fixture?: Fixture | null): number {
  if (!impliedProbabilities(fixture?.odds)) return fallbackDifficulty(fixture)
  const chance = winChance(fixture)
  return DIFFICULTY_THRESHOLDS.findIndex((threshold) => chance >= threshold) + 1 || 5
}

export function difficultyColor(difficulty: number): string {
  return DIFFICULTY_COLOR[difficulty - 1]
}

// Texto para el tooltip: de dónde sale el porcentaje.
export function oddsLabel(fixture?: Fixture | null): string {
  const odds = fixture?.odds
  if (!odds || !impliedProbabilities(odds)) return 'Estimación por dificultad del rival'
  const format = (v: number) => Number(v).toFixed(2).replace('.', ',')
  return `Cuotas 1X2: ${format(odds.home)} / ${format(odds.draw)} / ${format(odds.away)}`
}
