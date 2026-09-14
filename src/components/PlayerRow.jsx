import { POSITION_LABEL, PLAYER_STATUS, currentPrice, todayDelta, last } from '../data/mockPlayers'
import { formatDeltaShort, formatMillions } from '../utils/format'
import { difficultyColor, fixtureDifficulty, oddsLabel, winChance } from '../utils/opponent'
import TeamCrest from './TeamCrest'

export function StatusBadge({ status }) {
  const info = PLAYER_STATUS[status]
  if (!info) return null
  return <span className={`status-badge status-badge--${info.tone}`}>{info.label}</span>
}

export function DifficultyBars({ fixture }) {
  const difficulty = fixtureDifficulty(fixture)
  const color = difficultyColor(difficulty)
  return (
    <span
      className="diff-bars"
      role="img"
      aria-label={`Dificultad del rival ${difficulty} de 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ background: i <= difficulty ? color : 'var(--paper-dim)' }} />
      ))}
    </span>
  )
}

function Sparkline({ player }) {
  const points = last(player, 14).map((p) => p.price)
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const xy = points.map((v, i) => [
    (i / (points.length - 1 || 1)) * 80,
    24 - ((v - min) / range) * 20,
  ])
  const color = points[points.length - 1] >= points[0] ? 'var(--rise)' : 'var(--fall)'
  return (
    <svg className="sparkline" viewBox="0 0 80 28" preserveAspectRatio="none" aria-hidden="true">
      <path
        d={xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={xy[xy.length - 1][0]} cy={xy[xy.length - 1][1]} r="2.1" fill={color} />
    </svg>
  )
}

export default function PlayerRow({ player, status, onAdd, onRemove, inSquad, onSelect, nextFixture }) {
  const price = currentPrice(player)
  const delta = todayDelta(player)
  const disabled = !status.ok && !inSquad
  const trend = delta > 0 ? 'is-rise' : delta < 0 ? 'is-fall' : ''

  return (
    <li className={`player-row${inSquad ? ' player-row--added' : ''}`}>
      <span className={`player-row__pos player-row__pos--${player.pos}`}>{player.pos}</span>

      <button className="player-row__id player-row__id--link" onClick={() => onSelect(player)}>
        <span className="player-row__name-line">
          <span className="player-row__name">{player.name}</span>
          <StatusBadge status={player.status} />
        </span>
        <span className="player-row__team">
          <TeamCrest team={player.team} size={14} />
          {player.team} · {POSITION_LABEL[player.pos]}
        </span>
      </button>

      <Sparkline player={player} />

      <span className="player-row__points">{player.points}</span>

      <span className="player-row__ratio">
        {(player.points / (price / 1_000_000)).toFixed(1).replace('.', ',')}
      </span>

      <span className="player-row__next">
        {nextFixture ? (
          <>
            <TeamCrest team={nextFixture.opponent} size={16} />
            <span className="player-row__next-info">
              <span className="player-row__next-label">
                {nextFixture.home ? '' : '@ '}
                {nextFixture.opponent}
              </span>
              <span className="player-row__next-odds">
                <DifficultyBars fixture={nextFixture} />
                <span className="win-chance" title={`Victoria ${winChance(nextFixture)}% · ${oddsLabel(nextFixture)}`}>
                  {winChance(nextFixture)}%
                </span>
              </span>
            </span>
          </>
        ) : (
          <span className="player-row__next-label">—</span>
        )}
      </span>

      <span className="player-row__delta">
        <span className={`delta-pill ${trend}`}>
          {delta > 0 ? '↑' : delta < 0 ? '↓' : '·'} {formatDeltaShort(delta)}
        </span>
      </span>

      <span className="player-row__price">{formatMillions(price)}</span>

      {inSquad ? (
        <button className="btn btn--following" onClick={() => onRemove(player.id)}>
          Siguiendo
        </button>
      ) : (
        <button
          className="btn btn--add"
          disabled={disabled}
          onClick={() => onAdd(player)}
          title={!status.ok ? reasonLabel(status.reason) : 'Añadir a mi equipo'}
        >
          {status.ok ? 'Seguir' : reasonLabel(status.reason)}
        </button>
      )}
    </li>
  )
}

function reasonLabel(reason) {
  switch (reason) {
    case 'equipo-completo':
      return 'Equipo completo (25)'
    case 'no-autenticado':
      return 'Inicia sesión'
    default:
      return 'No disponible'
  }
}
