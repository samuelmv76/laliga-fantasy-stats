import { POSITION_LABEL, currentPrice, todayDelta, last } from '../data/mockPlayers'
import { formatEuros } from '../utils/format'
import TeamCrest from './TeamCrest'

function Sparkline({ player }) {
  const points = last(player, 7).map((p) => p.price)
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  return (
    <div className="sparkline" aria-hidden="true">
      {points.map((v, i) => (
        <span key={i} style={{ height: `${8 + ((v - min) / range) * 92}%` }} />
      ))}
    </div>
  )
}

export default function PlayerRow({ player, status, onAdd, onRemove, inSquad, onSelect }) {
  const price = currentPrice(player)
  const delta = todayDelta(player)
  const disabled = !status.ok && !inSquad

  return (
    <li className={`player-row${inSquad ? ' player-row--added' : ''}`}>
      <span className={`player-row__pos player-row__pos--${player.pos}`}>{player.pos}</span>

      <button className="player-row__id player-row__id--link" onClick={() => onSelect(player)}>
        <span className="player-row__name">{player.name}</span>
        <span className="player-row__team">
          <TeamCrest team={player.team} size={14} />
          {player.team} · {POSITION_LABEL[player.pos]}
        </span>
      </button>

      <Sparkline player={player} />

      <span className="player-row__points">{player.points}<small>pts</small></span>

      <span className={`player-row__delta ${delta > 0 ? 'is-rise' : delta < 0 ? 'is-fall' : ''}`}>
        {delta > 0 ? '▲' : delta < 0 ? '▼' : '·'} {formatEuros(Math.abs(delta))}
      </span>

      <span className="player-row__price">{formatEuros(price)}</span>

      {inSquad ? (
        <button className="btn btn--remove" onClick={() => onRemove(player.id)}>
          Quitar
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
