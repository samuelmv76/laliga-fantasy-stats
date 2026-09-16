import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from 'recharts'
import { chartDay, formatDay, formatEuros, formatEurosCompact } from '../utils/format.tsx'

export default function TeamDailyBars({ data }: { data: { date: string; delta: number }[] }) {
  return (
    <div className="rounded-[20px] border border-hairline bg-ink-soft px-4 pt-3.5 pb-1.5">
      <h3 className="m-0 mb-1.5 font-display text-[0.95rem] font-medium">Ganancia / pérdida diaria</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--paper-dim)" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDay} fontSize={11} stroke="var(--text-muted)" />
          <YAxis width={44} fontSize={11} stroke="var(--text-muted)" tickFormatter={formatEurosCompact} />
          <ReferenceLine y={0} stroke="var(--text-muted)" />
          <Tooltip
            formatter={(v) => [`${Number(v) > 0 ? '+' : ''}${formatEuros(Number(v))}`, 'Variación']}
            labelFormatter={chartDay}
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
