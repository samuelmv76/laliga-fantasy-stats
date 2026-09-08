export function formatDay(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
}

export function formatMoney(value) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}M`
}
