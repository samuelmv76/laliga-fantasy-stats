export function formatDay(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
}

// Las gráficas de recharts pasan el valor del eje como ReactNode, no como
// string, así que estos dos envoltorios evitan repetir el String()/Number()
// en cada Tooltip.
export const chartDay = (label: unknown): string => formatDay(String(label))
export const chartEuros = (value: unknown): string => formatEuros(Number(value))

// "Dom 21/09 · 21:00" a partir de un ISO datetime con offset (kickoff de un partido).
export function formatMatchDateTime(isoDateTime: string): string {
  const d = new Date(isoDateTime)
  const day = d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' })
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return `${day.replace('.', '')} · ${time}`
}

// Valor exacto en euros, con separador de miles español: 130345103 -> "130.345.103 €"
export function formatEuros(value: number): string {
  return `${Math.round(value).toLocaleString('es-ES')} €`
}

// Solo para ejes de gráfica, donde no cabe el valor exacto — nunca para
// el precio que se muestra como dato al usuario.
export function formatEurosCompact(value: number): string {
  return `${(value / 1_000_000).toFixed(1)}M`
}

// Valor de mercado en la tabla: 7380000 -> "7,38 M€"
export function formatMillions(value: number): string {
  return `${(value / 1_000_000).toFixed(2).replace('.', ',')} M€`
}

// Variación del día en la tabla: 80345 -> "80k €"
export function formatDeltaShort(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(2).replace('.', ',')}M €`
  if (abs >= 1000) return `${Math.round(abs / 1000)}k €`
  return `${Math.round(abs)} €`
}
