import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatDay, formatEuros, formatEurosCompact } from '../utils/format'

export default function TeamValueChart({ data }) {
  return (
    <div className="chart-card">
      <h3>Valor del equipo</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="teamValueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--turf)" stopOpacity={0.55} />
              <stop offset="100%" stopColor="var(--turf)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--paper-dim)" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDay} fontSize={11} stroke="var(--text-muted)" />
          <YAxis
            width={44}
            fontSize={11}
            stroke="var(--text-muted)"
            tickFormatter={formatEurosCompact}
            domain={['dataMin - 2000000', 'dataMax + 2000000']}
          />
          <Tooltip
            formatter={(v) => [formatEuros(v), 'Valor']}
            labelFormatter={formatDay}
            contentStyle={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', borderRadius: 6 }}
          />
          <Area type="monotone" dataKey="value" stroke="var(--turf)" strokeWidth={2} fill="url(#teamValueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
