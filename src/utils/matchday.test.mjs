// Comprobación de la ventana de la jornada que sale en la cabecera.
//   node src/utils/matchday.test.mjs
import assert from 'node:assert/strict'
import { formatKickoff, matchdayLabel, nextMatchdayWindow } from './matchday.js'

const ahora = new Date('2026-09-16T12:00:00+02:00')

// Jornada completa: 10 partidos, cada uno guardado por sus dos equipos.
function jornadaCompleta(matchday, kickoffs) {
  const fixtures = {}
  kickoffs.forEach((kickoff, i) => {
    fixtures[`local${i}`] = [{ matchday, kickoff, opponent: `visitante${i}`, home: true }]
    fixtures[`visitante${i}`] = [{ matchday, kickoff, opponent: `local${i}`, home: false }]
  })
  return fixtures
}

const diez = (dias) => [
  `2026-09-${dias}T21:00:00+02:00`,
  ...Array.from({ length: 8 }, () => `2026-09-${dias + 1}T18:30:00+02:00`),
  `2026-09-${dias + 2}T21:00:00+02:00`,
]

// Jornada que aún no ha empezado: primer y último partido.
const proxima = nextMatchdayWindow(jornadaCompleta(7, diez(18)))
assert.equal(proxima.matchday, 7)
assert.equal(proxima.started, false)
assert.equal(proxima.start.toISOString(), new Date('2026-09-18T21:00:00+02:00').toISOString())
assert.equal(proxima.end.toISOString(), new Date('2026-09-20T21:00:00+02:00').toISOString())
assert.equal(matchdayLabel(proxima, ahora).text, 'J7 · del vie 21:00 al dom 21:00')

// Manda la jornada más baja, aunque el calendario traiga varias.
const varias = { ...jornadaCompleta(7, diez(18)) }
for (const [team, list] of Object.entries(jornadaCompleta(8, diez(25)))) {
  varias[team] = [...(varias[team] ?? []), ...list]
}
assert.equal(nextMatchdayWindow(varias).matchday, 7)

// Jornada ya empezada: /api/fixtures solo devuelve los partidos que quedan,
// así que trae menos entradas que una jornada completa. No se puede decir
// "empieza", porque ya empezó.
const empezada = { ...varias }
for (const team of Object.keys(jornadaCompleta(7, diez(18)))) {
  empezada[team] = empezada[team].filter((f) => f.matchday !== 7 || f.kickoff.startsWith('2026-09-20'))
}
const enJuego = nextMatchdayWindow(empezada)
assert.equal(enJuego.matchday, 7)
assert.equal(enJuego.started, true)
assert.equal(enJuego.next.matchday, 8)
// (el cero del mes lo pone formatDay y depende del entorno, de ahí el regex)
assert.match(
  matchdayLabel(enJuego, ahora).text,
  /^J7 · en juego hasta dom 21:00 · J8 empieza vie 25\/0?9 · 21:00$/
)

// Con una sola jornada en el calendario no hay siguiente que anunciar (y
// tampoco se puede saber si esa ya ha empezado, porque no hay con qué
// comparar el número de partidos).
const solaJornada = nextMatchdayWindow({ local0: [{ matchday: 7, kickoff: '2026-09-20T21:00:00+02:00' }] })
assert.equal(solaJornada.next, null)
assert.equal(solaJornada.started, false)
assert.equal(matchdayLabel(solaJornada, ahora).text, 'J7 · dom 21:00')

// Jornada con un único horario para todos los partidos: no hay rango.
const unica = nextMatchdayWindow(jornadaCompleta(9, Array.from({ length: 10 }, () => '2026-09-19T21:00:00+02:00')))
assert.equal(matchdayLabel(unica, ahora).text, 'J9 · sáb 21:00')

// Sin calendario, o con basura, no se inventa nada.
assert.equal(nextMatchdayWindow(undefined), null)
assert.equal(nextMatchdayWindow({}), null)
assert.equal(nextMatchdayWindow({ Celta: [{ matchday: 'x', kickoff: 'ayer' }] }), null)
assert.equal(matchdayLabel(null), null)
// Una entrada rota no tumba las buenas.
const conBasura = { ...jornadaCompleta(7, diez(18)), Roto: [{ matchday: 7, kickoff: 'no-es-fecha' }] }
assert.equal(nextMatchdayWindow(conBasura).matchday, 7)

// El día de la semana solo basta dentro de la semana; más allá lleva fecha.
assert.equal(formatKickoff(new Date('2026-09-18T21:00:00+02:00'), ahora), 'vie 21:00')
// (el formato de la fecha lo pone formatDay, aquí solo importa que esté)
assert.match(formatKickoff(new Date('2026-10-10T21:00:00+02:00'), ahora), /^sáb 10\/10 · 21:00$/)
// Un partido ya jugado también la lleva: "dom" a secas sería el que viene.
assert.match(formatKickoff(new Date('2026-09-13T21:00:00+02:00'), ahora), /^dom 13\/0?9 · 21:00$/)

console.log('[ok] matchday.js: inicio, final y jornada en juego')
