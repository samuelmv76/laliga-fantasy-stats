// Comprobación mínima del cálculo de cuotas -> probabilidad -> dificultad.
//   node src/utils/opponent.test.mjs
import assert from 'node:assert/strict'
import { fixtureDifficulty, impliedProbabilities, winChance } from './opponent.js'

// Cuotas con margen: las probabilidades normalizadas suman 1.
const p = impliedProbabilities({ home: 1.5, draw: 4.2, away: 6.5 })
assert.ok(Math.abs(p.home + p.draw + p.away - 1) < 1e-9)
assert.ok(p.home > p.draw && p.draw > p.away)

// Favorito en casa: cuota baja -> victoria alta -> rival fácil.
const favorito = { home: true, opponent: 'Getafe', odds: { home: 1.4, draw: 4.8, away: 7.5 } }
assert.equal(winChance(favorito), 68)
assert.equal(fixtureDifficulty(favorito), 1)

// El mismo partido visto desde el visitante: gana el otro lado del 1X2.
const visitante = { home: false, opponent: 'Real Madrid', odds: { home: 1.4, draw: 4.8, away: 7.5 } }
assert.equal(winChance(visitante), 13)
assert.equal(fixtureDifficulty(visitante), 5)

// Sin cuotas usables se cae a la estimación por dificultad, no a NaN.
for (const odds of [undefined, null, {}, { home: 0.5, draw: 3, away: 4 }, { home: 'x', draw: 3, away: 4 }]) {
  const estimado = winChance({ home: true, opponent: 'Celta', difficulty: 3, odds })
  assert.ok(Number.isInteger(estimado) && estimado >= 5 && estimado <= 95, `winChance inválido: ${estimado}`)
  assert.equal(fixtureDifficulty({ opponent: 'Celta', difficulty: 3, odds }), 3)
}

console.log('[ok] opponent.js: cuotas, probabilidades y dificultad')
