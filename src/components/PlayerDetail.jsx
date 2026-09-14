import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { POSITION_LABEL } from '../data/mockPlayers'
import { formatDay, formatEuros, formatEurosCompact, formatMatchDateTime } from '../utils/format'
import TeamCrest from './TeamCrest'
import { StatCards } from './spectrumui/charts/stat-cards'

// Convierte los puntos de cada jornada (pueden ser negativos) en un total
// acumulado ascendente, para que la gráfica se lea como progreso de
// temporada en vez de como un vaivén de barras.
function cumulativeByMatchday(pointsByMatchday) {
  let total = 0
  return pointsByMatchday.map((d) => {
    total += d.points
    return { matchday: d.matchday, points: d.points, total }
  })
}

function MatchdayDot({ cx, cy, payload }) {
  if (cx == null || cy == null) return null
  const color = payload.points > 0 ? 'var(--rise)' : payload.points < 0 ? 'var(--fall)' : 'var(--text-muted)'
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="var(--paper)" strokeWidth={1.5} />
}

export default function PlayerDetail({ player, fixtures, inSquad, onAdd, onRemove, onClose }) {
  const [rendered, setRendered] = useState(player)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (player) {
      setRendered(player)
      setClosing(false)
    } else if (rendered) {
      setClosing(true)
    }
  }, [player])

  if (!rendered) return null

  const cumulativePoints = rendered.pointsByMatchday?.length
    ? cumulativeByMatchday(rendered.pointsByMatchday)
    : null
  const teamFixtures = fixtures?.[rendered.team]

  return (
    <div
      className={`modal-backdrop${closing ? ' is-closing' : ''}`}
      onClick={onClose}
      onAnimationEnd={() => closing && setRendered(null)}
    >
      <div className={`modal${closing ? ' is-closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        <p className="app__eyebrow modal__team-line" style={{ color: 'var(--turf)' }}>
          <TeamCrest team={rendered.team} size={16} />
          {rendered.team} · {POSITION_LABEL[rendered.pos]}
        </p>
        <h2 className="modal__title">{rendered.name}</h2>

        <StatCards
          className="modal__stat-cards"
          columns={2}
          cards={[
            {
              label: 'Precio actual',
              series: rendered.priceHistory?.map((d) => d.price),
              format: formatEurosCompact,
              deltaLabel: 'vs inicio del historial',
            },
            {
              label: 'Puntos',
              series:
                rendered.pointsHistory?.map((d) => d.points) ??
                rendered.pointsByMatchday?.map((d) => d.points),
              value: rendered.points,
              format: (v) => `${Math.round(v)}`,
              deltaLabel: 'vs inicio del historial',
            },
          ]}
        />

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={rendered.priceHistory} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--paper-dim)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDay} fontSize={11} stroke="var(--text-muted)" />
            <YAxis width={44} fontSize={11} stroke="var(--text-muted)" tickFormatter={formatEurosCompact} domain={['dataMin - 300000', 'dataMax + 300000']} />
            <Tooltip
              formatter={(v) => [formatEuros(v), 'Precio']}
              labelFormatter={formatDay}
              contentStyle={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', borderRadius: 6 }}
            />
            <Line type="monotone" dataKey="price" stroke="var(--turf)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>

        {cumulativePoints && (
          <>
            <h3 className="modal__section-title">Puntos por jornada</h3>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={cumulativePoints} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="pointsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--turf)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--turf)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--paper-dim)" vertical={false} />
                <XAxis dataKey="matchday" tickFormatter={(v) => `J${v}`} fontSize={11} stroke="var(--text-muted)" />
                <YAxis width={30} fontSize={11} stroke="var(--text-muted)" />
                <Tooltip
                  formatter={(v, _name, props) => [
                    `${v} pts (${props.payload.points >= 0 ? '+' : ''}${props.payload.points} esta jornada)`,
                    'Puntos totales',
                  ]}
                  labelFormatter={(v) => `Jornada ${v}`}
                  contentStyle={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', borderRadius: 6 }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--turf)"
                  strokeWidth={2}
                  fill="url(#pointsFill)"
                  dot={<MatchdayDot />}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}

        {!rendered.pointsByMatchday && rendered.pointsHistory && rendered.pointsHistory.length > 1 && (
          <>
            <h3 className="modal__section-title">Evolución de puntos</h3>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={rendered.pointsHistory} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--paper-dim)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDay} fontSize={11} stroke="var(--text-muted)" />
                <YAxis width={30} fontSize={11} stroke="var(--text-muted)" />
                <Tooltip
                  formatter={(v) => [v, 'Puntos totales']}
                  labelFormatter={formatDay}
                  contentStyle={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', borderRadius: 6 }}
                />
                <Line type="monotone" dataKey="points" stroke="var(--turf)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}

        {teamFixtures && teamFixtures.length > 0 && (
          <>
            <h3 className="modal__section-title">Próximos partidos</h3>
            <ul className="modal__fixtures">
              {teamFixtures.map((f) => (
                <li key={f.matchday} className="modal__fixture">
                  <span className="modal__fixture-matchday">J{f.matchday}</span>
                  <span className="modal__fixture-opponent">
                    <TeamCrest team={f.opponent} size={16} />
                    {f.home ? `vs ${f.opponent}` : `en ${f.opponent}`}
                  </span>
                  <span className="modal__fixture-time">{formatMatchDateTime(f.kickoff)}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {inSquad ? (
          <button className="btn btn--remove" onClick={() => onRemove(rendered.id)}>
            Quitar de mi equipo
          </button>
        ) : (
          <button className="btn btn--add" onClick={() => onAdd(rendered)}>
            Seguir en mi equipo
          </button>
        )}
      </div>
    </div>
  )
}
