// Declaración de tipos para el componente vendorizado de spectrum-ui, que es
// JavaScript. Sin esto, TypeScript deduce las props del array de ejemplo que
// trae por defecto y rechaza campos válidos como `value`.
export interface StatCard {
  label: string
  /** Serie para la mini-gráfica. Puede ir vacía si no hay histórico. */
  series?: number[]
  /** Valor a mostrar; si falta, se usa el último punto de la serie. */
  value?: number
  format?: (value: number) => string
  deltaLabel?: string
  goodWhen?: 'up' | 'down'
  /** Valor anterior para calcular la variación; si falta, el primero de la serie. */
  previous?: number
  caption?: string
}

export declare function StatCards(props: {
  className?: string
  cards?: StatCard[]
  columns?: number
  status?: 'ready' | 'loading' | 'empty' | 'error'
  onRetry?: () => void
}): JSX.Element
