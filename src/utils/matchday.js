// Cuándo empieza y cuándo acaba la jornada que viene, a partir del
// calendario de /api/fixtures.
import { formatDay } from './format.js'

// Una jornada completa de LaLiga son 10 partidos, y el calendario guarda cada
// partido dos veces (una por equipo). No se cablea ese 20: se toma el mayor
// número de entradas que tenga cualquier jornada del calendario, porque es el
// mismo dato y así no se rompe si algún día cambia el número de equipos.
function entriesByMatchday(fixtures) {
  const byMatchday = {}
  for (const fixture of Object.values(fixtures ?? {}).flat()) {
    // Dato externo: solo cuentan los partidos con jornada y hora válidas.
    if (!Number.isFinite(fixture?.matchday) || Number.isNaN(Date.parse(fixture?.kickoff))) continue
    ;(byMatchday[fixture.matchday] ??= []).push(new Date(fixture.kickoff))
  }
  return byMatchday
}

// { matchday, start, end, started, next } de la jornada en curso o la que
// viene, o null si no hay calendario. `started` es true cuando la jornada ya ha
// empezado: /api/fixtures solo devuelve los partidos que quedan, así que en ese
// caso `start` no es el principio real de la jornada y no se debe enseñar como
// tal. `next` es { matchday, start } de la jornada siguiente, para poder decir
// cuándo arranca la próxima mientras se juega esta.
export function nextMatchdayWindow(fixtures) {
  const byMatchday = entriesByMatchday(fixtures)
  const matchdays = Object.keys(byMatchday).map(Number)
  if (matchdays.length === 0) return null

  const matchday = Math.min(...matchdays)
  const kickoffs = byMatchday[matchday].sort((a, b) => a - b)
  const full = Math.max(...matchdays.map((m) => byMatchday[m].length))

  const following = matchdays.filter((m) => m > matchday)
  const next = following.length > 0 ? Math.min(...following) : null

  return {
    matchday,
    start: kickoffs[0],
    end: kickoffs[kickoffs.length - 1],
    started: kickoffs.length < full,
    next: next === null ? null : { matchday: next, start: byMatchday[next].sort((a, b) => a - b)[0] },
  }
}

// "vie 18/09 21:00". La fecha va siempre, aunque el partido sea mañana: con
// el día de la semana solo no se sabe de qué mes se habla, y entre jornadas
// puede haber tres semanas de parón.
export function formatKickoff(date) {
  const weekday = date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return `${weekday} ${formatDay(date)} ${time}`
}

// Texto de la píldora de la cabecera y su tooltip.
export function matchdayLabel(window) {
  if (!window) return null
  const { matchday } = window
  const start = formatKickoff(window.start)
  const end = formatKickoff(window.end)

  if (window.started) {
    // Mientras se juega esta jornada, lo útil es cuándo arranca la siguiente:
    // es la hora a la que hay que tener el equipo hecho.
    const next = window.next && {
      matchday: window.next.matchday,
      start: formatKickoff(window.next.start),
    }
    const despues = next ? ` · J${next.matchday} empieza ${next.start}` : ''
    return {
      matchday,
      text: `J${matchday} · en juego hasta ${end}${despues}`,
      title:
        `Jornada ${matchday} en juego, último partido ${end}.` +
        (next ? ` La jornada ${next.matchday} empieza ${next.start}.` : ''),
    }
  }

  // El calendario puede traer un único horario para toda la jornada (aún sin
  // confirmar): entonces no hay rango que enseñar.
  if (start === end) {
    return {
      matchday,
      text: `J${matchday} · ${start}`,
      title: `Jornada ${matchday}: ${start}.`,
    }
  }
  return {
    matchday,
    text: `J${matchday} · del ${start} al ${end}`,
    title: `Jornada ${matchday}: primer partido ${start}, último partido ${end}.`,
  }
}
