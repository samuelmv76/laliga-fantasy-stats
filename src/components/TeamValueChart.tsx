import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { chartDay, chartEuros, formatDay, formatEurosCompact } from '../utils/format.tsx'

export default function TeamValueChart({ data }: { data: { date: string; value: number }[] }) {
  return (
    <div className="rounded-[20px] border border-hairline bg-ink-soft px-4 pt-3.5 pb-1.5">
      <h3 className="m-0 mb-1.5 font-display text-[0.95rem] font-medium">Valor del equipo</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
            formatter={(v) => [chartEuros(v), 'Valor']}
            labelFormatter={chartDay}
            contentStyle={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', borderRadius: 6 }}
          />
          <Area type="monotone" dataKey="value" stroke="var(--turf)" strokeWidth={2} fill="url(#teamValueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
