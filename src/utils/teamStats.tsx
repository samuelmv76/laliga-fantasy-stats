// Todas las fechas que aparecen en el histórico de al menos un jugador,
// ordenadas. Sirve como eje X común para las gráficas del equipo.
import type { Player } from '../types.tsx'

export function unionDates(players: Player[]): string[] {
  const set = new Set<string>()
  players.forEach((p) => p.priceHistory.forEach((h) => set.add(h.date)))
  return [...set].sort()
}

function priceOnDate(player: Player, date: string): number | null {
  const entry = player.priceHistory.find((h) => h.date === date)
  return entry ? entry.price : null
}

// Valor total del equipo cada día del rango (suma de los jugadores actuales,
// aplicado retroactivamente a modo de "cuánto valdría este once cada día").
export function teamValueSeries(squad: Player[], dateRange: string[]) {
  return dateRange.map((date) => ({
    date,
    value: squad.reduce((sum, p) => sum + (priceOnDate(p, date) ?? 0), 0),
  }))
}

// Ganancia/pérdida del equipo cada día respecto al día anterior.
export function teamDailySeries(squad: Player[], dateRange: string[]) {
  const out: { date: string; delta: number }[] = []
  for (let i = 1; i < dateRange.length; i++) {
    const date = dateRange[i]
    const prev = dateRange[i - 1]
    const delta = squad.reduce((sum, p) => {
      const today = priceOnDate(p, date)
      const yesterday = priceOnDate(p, prev)
      if (today == null || yesterday == null) return sum
      return sum + (today - yesterday)
    }, 0)
    out.push({ date, delta })
  }
  return out
}
