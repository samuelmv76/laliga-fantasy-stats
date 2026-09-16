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

// { matchday, start, end, started } de la próxima jornada, o null si no hay
// calendario. `started` es true cuando la jornada ya ha empezado: /api/fixtures
// solo devuelve los partidos que quedan, así que en ese caso `start` no es el
// principio real de la jornada y no se debe enseñar como tal.
export function nextMatchdayWindow(fixtures) {
  const byMatchday = entriesByMatchday(fixtures)
  const matchdays = Object.keys(byMatchday).map(Number)
  if (matchdays.length === 0) return null

  const matchday = Math.min(...matchdays)
  const kickoffs = byMatchday[matchday].sort((a, b) => a - b)
  const full = Math.max(...matchdays.map((m) => byMatchday[m].length))

  return {
    matchday,
    start: kickoffs[0],
    end: kickoffs[kickoffs.length - 1],
    started: kickoffs.length < full,
  }
}

// "vie 21:00" para esta semana; "sáb 10/10 · 21:00" si cae más allá, donde el
// día de la semana solo no basta para situarlo.
export function formatKickoff(date, now = new Date()) {
  const weekday = date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const days = (date - now) / 86_400_000
  if (days < 0 || days >= 6) return `${weekday} ${formatDay(date)} · ${time}`
  return `${weekday} ${time}`
}

// Texto de la píldora de la cabecera y su tooltip.
export function matchdayLabel(window, now = new Date()) {
  if (!window) return null
  const { matchday } = window
  const start = formatKickoff(window.start, now)
  const end = formatKickoff(window.end, now)

  if (window.started) {
    return {
      matchday,
      text: `J${matchday} · en juego · hasta ${end}`,
      title: `Jornada ${matchday} en juego. Último partido: ${end}.`,
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
