// Comprobación de la ventana de la jornada que sale en la cabecera.
import assert from 'node:assert/strict'
import { formatKickoff, matchdayLabel, nextMatchdayWindow } from './matchday.tsx'
import type { FixturesByTeam } from '../types.tsx'
import { test } from 'vitest'

test('matchday.js: inicio, final y jornada en juego', () => {
  // Jornada completa: 10 partidos, cada uno guardado por sus dos equipos.
  function jornadaCompleta(matchday: number, kickoffs: string[]): FixturesByTeam {
    const fixtures: FixturesByTeam = {}
    kickoffs.forEach((kickoff, i) => {
      fixtures[`local${i}`] = [{ matchday, kickoff, opponent: `visitante${i}`, home: true }]
      fixtures[`visitante${i}`] = [{ matchday, kickoff, opponent: `local${i}`, home: false }]
    })
    return fixtures
  }

  const diez = (dias: number) => [
    `2026-09-${dias}T21:00:00+02:00`,
    ...Array.from({ length: 8 }, () => `2026-09-${dias + 1}T18:30:00+02:00`),
    `2026-09-${dias + 2}T21:00:00+02:00`,
  ]

  // Jornada que aún no ha empezado: primer y último partido.
  const proxima = nextMatchdayWindow(jornadaCompleta(7, diez(18)))!
  assert.equal(proxima.matchday, 7)
  assert.equal(proxima.started, false)
  assert.equal(proxima.start.toISOString(), new Date('2026-09-18T21:00:00+02:00').toISOString())
  assert.equal(proxima.end.toISOString(), new Date('2026-09-20T21:00:00+02:00').toISOString())
  assert.match(matchdayLabel(proxima)!.text, /^J7 · del vie 18\/0?9 21:00 al dom 20\/0?9 21:00$/)

  // Manda la jornada más baja, aunque el calendario traiga varias.
  const varias = { ...jornadaCompleta(7, diez(18)) }
  for (const [team, list] of Object.entries(jornadaCompleta(8, diez(25)))) {
    varias[team] = [...(varias[team] ?? []), ...list]
  }
  assert.equal(nextMatchdayWindow(varias)!.matchday, 7)

  // Jornada ya empezada: /api/fixtures solo devuelve los partidos que quedan,
  // así que trae menos entradas que una jornada completa. No se puede decir
  // "empieza", porque ya empezó.
  const empezada = { ...varias }
  for (const team of Object.keys(jornadaCompleta(7, diez(18)))) {
    empezada[team] = empezada[team].filter((f) => f.matchday !== 7 || f.kickoff.startsWith('2026-09-20'))
  }
  const enJuego = nextMatchdayWindow(empezada)!
  assert.equal(enJuego.matchday, 7)
  assert.equal(enJuego.started, true)
  assert.equal(enJuego.next!.matchday, 8)
  // (el cero del mes lo pone formatDay y depende del entorno, de ahí el regex)
  assert.match(
    matchdayLabel(enJuego)!.text,
    /^J7 · en juego hasta dom 20\/0?9 21:00 · J8 empieza vie 25\/0?9 21:00$/
  )

  // Con una sola jornada en el calendario no hay siguiente que anunciar (y
  // tampoco se puede saber si esa ya ha empezado, porque no hay con qué
  // comparar el número de partidos).
  const solaJornada = nextMatchdayWindow({
    local0: [{ matchday: 7, kickoff: '2026-09-20T21:00:00+02:00', opponent: 'visitante0', home: true }],
  })!
  assert.equal(solaJornada.next, null)
  assert.equal(solaJornada.started, false)
  assert.match(matchdayLabel(solaJornada)!.text, /^J7 · dom 20\/0?9 21:00$/)

  // Jornada con un único horario para todos los partidos: no hay rango.
  const unica = nextMatchdayWindow(jornadaCompleta(9, Array.from({ length: 10 }, () => '2026-09-19T21:00:00+02:00')))!
  assert.match(matchdayLabel(unica)!.text, /^J9 · sáb 19\/0?9 21:00$/)

  // Sin calendario, o con basura, no se inventa nada.
  assert.equal(nextMatchdayWindow(undefined), null)
  assert.equal(nextMatchdayWindow({}), null)
  assert.equal(nextMatchdayWindow({ Celta: [{ matchday: 'x', kickoff: 'ayer' } as never] }), null)
  assert.equal(matchdayLabel(null), null)
  // Una entrada rota no tumba las buenas.
  const conBasura: FixturesByTeam = {
    ...jornadaCompleta(7, diez(18)),
    Roto: [{ matchday: 7, kickoff: 'no-es-fecha', opponent: 'nadie', home: true }],
  }
  assert.equal(nextMatchdayWindow(conBasura)!.matchday, 7)

  // La fecha va siempre, esté el partido cerca o lejos (el cero del mes lo pone
  // formatDay y depende del entorno, de ahí el regex).
  assert.match(formatKickoff(new Date('2026-09-18T21:00:00+02:00')), /^vie 18\/0?9 21:00$/)
  assert.match(formatKickoff(new Date('2026-10-10T21:00:00+02:00')), /^sáb 10\/10 21:00$/)
})
