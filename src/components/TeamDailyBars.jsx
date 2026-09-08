import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from 'recharts'
import { formatDay } from '../utils/format'

export default function TeamDailyBars({ data }) {
  return (
    <div className="chart-card">
      <h3>Ganancia / pérdida diaria</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--paper-dim)" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDay} fontSize={11} stroke="var(--text-muted)" />
          <YAxis width={44} fontSize={11} stroke="var(--text-muted)" tickFormatter={(v) => `${v}M`} />
          <ReferenceLine y={0} stroke="var(--text-muted)" />
          <Tooltip
            formatter={(v) => [`${v > 0 ? '+' : ''}${v}M`, 'Variación']}
            labelFormatter={formatDay}
            contentStyle={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', borderRadius: 6 }}
          />
          <Bar dataKey="delta" radius={[3, 3, 3, 3]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.delta >= 0 ? 'var(--rise)' : 'var(--fall)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
