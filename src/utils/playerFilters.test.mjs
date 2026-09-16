// Comprobación del filtrado y el orden que comparten Mercado y Mi equipo.
//   node src/utils/playerFilters.test.mjs
import assert from 'node:assert/strict'
import {
  EMPTY_FILTERS,
  SORT_BY_DIFFICULTY,
  SORTERS,
  countActive,
  difficultyByTeam,
  filterPlayers,
  numberOrNull,
  sortPlayers,
} from './playerFilters.js'

function jugador(extra) {
  return {
    id: extra.id,
    name: extra.name ?? `Jugador ${extra.id}`,
    team: extra.team ?? 'Celta',
    pos: extra.pos ?? 'DEL',
    points: extra.points ?? 10,
    played: extra.played ?? 5,
    status: extra.status,
    priceHistory: [
      { date: '2026-09-01', price: 8_000_000 },
      { date: '2026-09-02', price: (extra.price ?? 10) * 1_000_000 },
    ],
    pointsByMatchday: extra.pointsByMatchday ?? [
      { matchday: 1, points: 2 },
      { matchday: 2, points: 2 },
      { matchday: 3, points: 2 },
    ],
  }
}

const players = [
  jugador({ id: '1', name: 'Portero caro', pos: 'POR', team: 'Barcelona', price: 20, points: 30 }),
  jugador({ id: '2', name: 'Delantero lesionado', pos: 'DEL', team: 'Celta', price: 5, points: 4, status: 'lesion' }),
  jugador({ id: '3', name: 'Medio en duda', pos: 'MID', team: 'Getafe', price: 10, points: 20, status: 'duda' }),
  jugador({ id: '4', name: 'Defensa barato', pos: 'DEF', team: 'Celta', price: 2, points: 12, played: 2 }),
]

const ids = (list) => list.map((p) => p.id).join(',')

// Sin filtros no se cae nadie.
assert.equal(filterPlayers(players, EMPTY_FILTERS).length, 4)
assert.equal(countActive(EMPTY_FILTERS), 0)

// Posición y equipo son multi-selección: suman en OR dentro del grupo y en
// AND entre grupos.
assert.equal(ids(filterPlayers(players, { ...EMPTY_FILTERS, positions: ['POR'] })), '1')
assert.equal(ids(filterPlayers(players, { ...EMPTY_FILTERS, positions: ['POR', 'DEF'] })), '1,4')
assert.equal(ids(filterPlayers(players, { ...EMPTY_FILTERS, teams: ['Celta'] })), '2,4')
assert.equal(
  ids(filterPlayers(players, { ...EMPTY_FILTERS, positions: ['DEF'], teams: ['Celta'] })),
  '4'
)

// Estado: 'ok' es el jugador sin `status`.
assert.equal(ids(filterPlayers(players, { ...EMPTY_FILTERS, statuses: ['ok'] })), '1,4')
assert.equal(ids(filterPlayers(players, { ...EMPTY_FILTERS, statuses: ['lesion', 'duda'] })), '2,3')

// Precio en millones, extremos incluidos.
assert.equal(ids(filterPlayers(players, { ...EMPTY_FILTERS, maxPrice: '5' })), '2,4')
assert.equal(ids(filterPlayers(players, { ...EMPTY_FILTERS, minPrice: '10' })), '1,3')
assert.equal(ids(filterPlayers(players, { ...EMPTY_FILTERS, minPrice: '5', maxPrice: '10' })), '2,3')

// Mínimos de rendimiento. El defensa lleva 12 puntos en 2 partidos: media 6.
assert.equal(ids(filterPlayers(players, { ...EMPTY_FILTERS, minPoints: '20' })), '1,3')
assert.equal(ids(filterPlayers(players, { ...EMPTY_FILTERS, minAverage: '6' })), '1,4')
assert.equal(ids(filterPlayers(players, { ...EMPTY_FILTERS, minForm: '6' })), '1,2,3,4')
assert.equal(ids(filterPlayers(players, { ...EMPTY_FILTERS, minForm: '7' })), '')

// Un mínimo de 0 filtra de verdad; '' es "sin filtro".
const conNegativo = [...players, jugador({ id: '5', points: -3, pointsByMatchday: [{ matchday: 1, points: -3 }] })]
assert.equal(filterPlayers(conNegativo, { ...EMPTY_FILTERS, minPoints: '0' }).length, 4)
assert.equal(filterPlayers(conNegativo, { ...EMPTY_FILTERS, minPoints: '' }).length, 5)
assert.equal(numberOrNull(''), null)
assert.equal(numberOrNull('abc'), null)
assert.equal(numberOrNull('0'), 0)

// La búsqueda mira nombre y equipo, sin distinguir mayúsculas.
assert.equal(ids(filterPlayers(players, EMPTY_FILTERS, { query: 'PORTERO' })), '1')
assert.equal(ids(filterPlayers(players, EMPTY_FILTERS, { query: 'celta' })), '2,4')

// Calendario: la dificultad se calcula por equipo, no por jugador.
const facil = { home: true, opponent: 'Getafe', odds: { home: 1.4, draw: 4.8, away: 7.5 } }
const dificil = { home: false, opponent: 'Real Madrid', odds: { home: 1.4, draw: 4.8, away: 7.5 } }
const fixtures = { Celta: [facil], Barcelona: [dificil] } // Getafe sin calendario
const difficulty = difficultyByTeam(['Celta', 'Barcelona', 'Getafe'], fixtures)
assert.equal(ids(filterPlayers(players, { ...EMPTY_FILTERS, difficulties: ['facil'] }, { difficulty })), '2,4')
assert.equal(ids(filterPlayers(players, { ...EMPTY_FILTERS, difficulties: ['dificil'] }, { difficulty })), '1')
// Sin calendario no se cuela en ningún tramo.
assert.equal(
  ids(filterPlayers(players, { ...EMPTY_FILTERS, difficulties: ['facil', 'media', 'dificil'] }, { difficulty })),
  '1,2,4'
)

// Contador de filtros activos para el badge de "Más filtros".
assert.equal(countActive({ ...EMPTY_FILTERS, positions: ['POR'], minPrice: '3' }), 2)
assert.equal(countActive({ ...EMPTY_FILTERS, minPrice: '' }), 0)

// Orden: por puntos descendente y por calendario ascendente.
assert.equal(ids(sortPlayers([...players], 'puntos')), '1,3,4,2')
assert.equal(ids(sortPlayers([...players], 'precio')), '1,3,2,4')
// Getafe no tiene calendario: al final, no como si fuera el más fácil.
assert.equal(ids(sortPlayers([...players], SORT_BY_DIFFICULTY, difficulty)), '2,4,1,3')

// Todos los órdenes existen y devuelven números.
for (const [key, sorter] of Object.entries(SORTERS)) {
  assert.ok(Number.isFinite(sorter(players[0], players[1])), `orden inválido: ${key}`)
}

console.log('[ok] playerFilters.js: filtros, búsqueda, calendario y orden')
