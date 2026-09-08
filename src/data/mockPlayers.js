// Datos de prueba. En producción, cada jugador vendrá con su histórico real
// de precios (uno por día, actualizado cada noche por el scraper).

const BASE_PLAYERS = [
  { id: 1, name: 'Ter Stegen', team: 'Barcelona', pos: 'POR', basePrice: 6.2 },
  { id: 2, name: 'Unai Simón', team: 'Athletic', pos: 'POR', basePrice: 5.1 },
  { id: 3, name: 'David Soria', team: 'Getafe', pos: 'POR', basePrice: 4.0 },
  { id: 4, name: 'Aitor Fernández', team: 'Valladolid', pos: 'POR', basePrice: 2.8 },

  { id: 5, name: 'Militão', team: 'Real Madrid', pos: 'DEF', basePrice: 7.4 },
  { id: 6, name: 'Koundé', team: 'Barcelona', pos: 'DEF', basePrice: 6.8 },
  { id: 7, name: 'Le Normand', team: 'Atlético', pos: 'DEF', basePrice: 5.9 },
  { id: 8, name: 'Yeremy Pino', team: 'Villarreal', pos: 'DEF', basePrice: 4.6 },
  { id: 9, name: 'Mingueza', team: 'Celta', pos: 'DEF', basePrice: 4.2 },
  { id: 10, name: 'Vivian', team: 'Athletic', pos: 'DEF', basePrice: 5.3 },

  { id: 11, name: 'Pedri', team: 'Barcelona', pos: 'MID', basePrice: 8.9 },
  { id: 12, name: 'Fede Valverde', team: 'Real Madrid', pos: 'MID', basePrice: 9.4 },
  { id: 13, name: 'Nico Williams', team: 'Athletic', pos: 'MID', basePrice: 8.1 },
  { id: 14, name: 'Isco', team: 'Betis', pos: 'MID', basePrice: 6.5 },
  { id: 15, name: 'Álex Baena', team: 'Villarreal', pos: 'MID', basePrice: 7.2 },
  { id: 16, name: 'Merino', team: 'Real Madrid', pos: 'MID', basePrice: 5.8 },

  { id: 17, name: 'Lewandowski', team: 'Barcelona', pos: 'DEL', basePrice: 10.8 },
  { id: 18, name: 'Vinícius Jr', team: 'Real Madrid', pos: 'DEL', basePrice: 12.3 },
  { id: 19, name: 'Griezmann', team: 'Atlético', pos: 'DEL', basePrice: 9.6 },
  { id: 20, name: 'Ayoze Pérez', team: 'Villarreal', pos: 'DEL', basePrice: 6.4 },
  { id: 21, name: 'Borja Iglesias', team: 'Celta', pos: 'DEL', basePrice: 5.2 },
  { id: 22, name: 'Sørloth', team: 'Villarreal', pos: 'DEL', basePrice: 7.8 },
]

// Jornadas jugadas hasta ahora (temporada de referencia del proyecto: J5).
const MATCHDAYS = [1, 2, 3, 4, 5]

// Puntos por jornada, deterministas (mismo generador que seededWalk pero
// para enteros pequeños tipo puntuación fantasy).
function seededPoints(seed, count) {
  let s = seed
  const out = []
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280
    const rnd = s / 233280
    out.push(Math.round(-2 + rnd * 16)) // de -2 a 14 puntos por jornada
  }
  return out
}

export const POSITIONS = ['POR', 'DEF', 'MID', 'DEL']

export const POSITION_LABEL = {
  POR: 'Portero',
  DEF: 'Defensa',
  MID: 'Centrocampista',
  DEL: 'Delantero',
}

const HISTORY_DAYS = 14

// Generador determinista (mismo resultado siempre) para simular el histórico
// real de precios: sube y baja como en futbolfantasy.com, sin ser aleatorio
// de verdad entre recargas.
function seededWalk(seed, days, basePrice) {
  let value = basePrice * 0.88 // hace 14 días valía algo menos que hoy, de media
  let s = seed
  const steps = []
  for (let i = 0; i < days; i++) {
    s = (s * 9301 + 49297) % 233280
    const rnd = s / 233280 // 0..1
    const move = (rnd - 0.47) * (basePrice * 0.035) // variación diaria realista
    value = Math.max(basePrice * 0.5, value + move)
    steps.push(value)
  }
  // fuerza a que el último día coincida exactamente con el precio "actual" publicitado
  steps[steps.length - 1] = basePrice
  return steps
}

function datesBack(days) {
  const dates = []
  const today = new Date('2026-09-08') // fecha de referencia del proyecto
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

const DATES = datesBack(HISTORY_DAYS)

export const TEAMS = [...new Set(BASE_PLAYERS.map((p) => p.team))].sort()

export const PLAYERS = BASE_PLAYERS.map((p) => {
  const walk = seededWalk(p.id * 97 + 13, HISTORY_DAYS, p.basePrice)
  const priceHistory = DATES.map((date, i) => ({ date, price: +walk[i].toFixed(1) }))

  const jornadaPoints = seededPoints(p.id * 53 + 7, MATCHDAYS.length)
  const pointsByMatchday = MATCHDAYS.map((matchday, i) => ({ matchday, points: jornadaPoints[i] }))
  const points = jornadaPoints.reduce((sum, v) => sum + v, 0)

  return { ...p, priceHistory, pointsByMatchday, points }
})

export function currentPrice(player) {
  return player.priceHistory[player.priceHistory.length - 1].price
}

export function todayDelta(player) {
  const h = player.priceHistory
  return +(h[h.length - 1].price - h[h.length - 2].price).toFixed(1)
}

export function last(player, n) {
  return player.priceHistory.slice(-n)
}

export const DATE_RANGE = DATES
