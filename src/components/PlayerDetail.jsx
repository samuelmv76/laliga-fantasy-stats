import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { POSITION_LABEL, currentPrice, todayDelta } from '../data/mockPlayers'
import { formatDay, formatEuros, formatEurosCompact } from '../utils/format'

export default function PlayerDetail({ player, inSquad, onAdd, onRemove, onClose }) {
  if (!player) return null
  const delta = todayDelta(player)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        <p className="app__eyebrow" style={{ color: 'var(--turf)' }}>
          {player.team} · {POSITION_LABEL[player.pos]}
        </p>
        <h2 className="modal__title">{player.name}</h2>

        <div className="modal__stats">
          <div>
            <span className="scoreboard__label">Precio actual</span>
            <span className="modal__stat-value">{formatEuros(currentPrice(player))}</span>
          </div>
          <div>
            <span className="scoreboard__label">Variación hoy</span>
            <span className={`modal__stat-value ${delta > 0 ? 'is-rise' : delta < 0 ? 'is-fall' : ''}`}>
              {delta > 0 ? '+' : ''}
              {formatEuros(delta)}
            </span>
          </div>
          <div>
            <span className="scoreboard__label">Puntos</span>
            <span className="modal__stat-value">{player.points}</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={player.priceHistory} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
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

        {player.pointsByMatchday && player.pointsByMatchday.length > 0 && (
          <>
            <h3 className="modal__section-title">Puntos por jornada</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={player.pointsByMatchday} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--paper-dim)" vertical={false} />
                <XAxis dataKey="matchday" tickFormatter={(v) => `J${v}`} fontSize={11} stroke="var(--text-muted)" />
                <YAxis width={30} fontSize={11} stroke="var(--text-muted)" />
                <Tooltip
                  formatter={(v) => [v, 'Puntos']}
                  labelFormatter={(v) => `Jornada ${v}`}
                  contentStyle={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', borderRadius: 6 }}
                />
                <Bar dataKey="points" radius={[3, 3, 3, 3]}>
                  {player.pointsByMatchday.map((d, i) => (
                    <Cell key={i} fill={d.points >= 0 ? 'var(--rise)' : 'var(--fall)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {!player.pointsByMatchday && player.pointsHistory && player.pointsHistory.length > 1 && (
          <>
            <h3 className="modal__section-title">Evolución de puntos</h3>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={player.pointsHistory} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
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

        {inSquad ? (
          <button className="btn btn--remove" onClick={() => onRemove(player.id)}>
            Quitar de mi equipo
          </button>
        ) : (
          <button className="btn btn--add" onClick={() => onAdd(player)}>
            Seguir en mi equipo
          </button>
        )}
      </div>
    </div>
  )
}
