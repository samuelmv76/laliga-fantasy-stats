export function formatDay(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
}

// "Dom 21/09 · 21:00" a partir de un ISO datetime con offset (kickoff de un partido).
export function formatMatchDateTime(isoDateTime) {
  const d = new Date(isoDateTime)
  const day = d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' })
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return `${day.replace('.', '')} · ${time}`
}

// Valor exacto en euros, con separador de miles español: 130345103 -> "130.345.103 €"
export function formatEuros(value) {
  return `${Math.round(value).toLocaleString('es-ES')} €`
}

// Solo para ejes de gráfica, donde no cabe el valor exacto — nunca para
// el precio que se muestra como dato al usuario.
export function formatEurosCompact(value) {
  return `${(value / 1_000_000).toFixed(1)}M`
}
