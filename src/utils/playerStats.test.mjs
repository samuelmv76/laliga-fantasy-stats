// Comprobación mínima de las estadísticas derivadas y de los tramos de
// dificultad que usan los filtros del mercado.
//   node src/utils/playerStats.test.mjs
import assert from 'node:assert/strict'
import {
  DIFFICULTY_BANDS,
  difficultyBand,
  form,
  fromPeak,
  matchesPlayed,
  nextDifficulty,
  pointsAverage,
  pointsPerMillion,
  priceDelta,
} from './playerStats.js'

const player = {
  pos: 'DEL',
  points: 24,
  played: 4,
  priceHistory: [
    { date: '2026-09-01', price: 10_000_000 },
    { date: '2026-09-02', price: 12_000_000 },
    { date: '2026-09-03', price: 11_000_000 },
  ],
  pointsByMatchday: [
    { matchday: 1, points: 10 },
    { matchday: 2, points: -2 },
    { matchday: 3, points: 8 },
    { matchday: 4, points: 8 },
  ],
}

// Media por partido jugado, no por jornada disputada por la liga.
assert.equal(matchesPlayed(player), 4)
assert.equal(pointsAverage(player), 6)

// `played` manda sobre el número de jornadas con datos: un jugador puede
// haber jugado partidos sin puntuar en el desglose.
assert.equal(matchesPlayed({ ...player, played: 6 }), 6)
assert.equal(matchesPlayed({ points: 0, pointsByMatchday: [{ matchday: 1, points: 3 }] }), 1)

// Sin partidos jugados la media es 0, nunca NaN ni Infinity.
assert.equal(pointsAverage({ points: 0, played: 0, pointsByMatchday: [] }), 0)

// Forma: solo las últimas 3 jornadas (-2 + 8 + 8), no el total.
assert.equal(form(player), 14)
assert.equal(form(player, 1), 8)
assert.equal(form({ points: 5 }), 0)

// Precio: 11M hoy contra 12M hace un punto de historial.
assert.equal(priceDelta(player, 1), -1_000_000)
assert.equal(priceDelta(player, 2), 1_000_000)
// Más días de los que hay: usa el punto más antiguo, no se sale del array.
assert.equal(priceDelta(player, 99), 1_000_000)
assert.equal(priceDelta({ priceHistory: [{ date: '2026-09-01', price: 5 }] }), 0)

// Está un 8,33% por debajo de su máximo (11M sobre 12M).
assert.ok(Math.abs(fromPeak(player) - (11 / 12 - 1)) < 1e-9)
assert.equal(fromPeak({ priceHistory: [] }), 0)

assert.equal(pointsPerMillion(player), 24 / 11)

// Calendario: media de dificultad de los próximos partidos (por cuotas).
const facil = { home: true, opponent: 'Getafe', odds: { home: 1.4, draw: 4.8, away: 7.5 } }
const dificil = { home: false, opponent: 'Real Madrid', odds: { home: 1.4, draw: 4.8, away: 7.5 } }
assert.equal(nextDifficulty([facil]), 1)
assert.equal(nextDifficulty([dificil]), 5)
assert.equal(nextDifficulty([facil, dificil]), 3)
// Solo mira los `count` primeros partidos.
assert.equal(nextDifficulty([facil, dificil, dificil], 1), 1)
// Sin calendario devuelve null, que el filtro trata como "no se sabe".
assert.equal(nextDifficulty(undefined), null)
assert.equal(nextDifficulty([]), null)

// Tramos: cada dificultad cae en uno y solo uno, y null no inventa tramo.
assert.equal(difficultyBand(1), 'facil')
assert.equal(difficultyBand(2.5), 'facil')
assert.equal(difficultyBand(3), 'media')
assert.equal(difficultyBand(4.2), 'dificil')
assert.equal(difficultyBand(null), null)
for (const value of [1, 2, 3, 4, 5]) {
  assert.ok(DIFFICULTY_BANDS.some((band) => band.id === difficultyBand(value)))
}

console.log('[ok] playerStats.js: media, forma, precio, calendario y tramos')
