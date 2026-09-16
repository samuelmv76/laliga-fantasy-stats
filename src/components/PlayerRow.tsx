import { POSITION_LABEL, PLAYER_STATUS, currentPrice, todayDelta, last } from '../data/mockPlayers.tsx'
import { formatDeltaShort, formatMillions } from '../utils/format.tsx'
import { difficultyColor, fixtureDifficulty, oddsLabel, winChance } from '../utils/opponent.tsx'
import type { AddCheck, Fixture, Player, PlayerStatus } from '../types.tsx'
import TeamCrest from './TeamCrest.tsx'

// Las 9 columnas de la tabla. La cabecera y cada fila comparten esta rejilla:
// si cambia una, cambia la otra.
export const ROW_GRID = 'grid grid-cols-[34px_minmax(140px,1fr)_86px_48px_62px_116px_104px_104px_96px] items-center gap-2.5'

const POS_COLOR: Record<string, string> = {
  POR: 'text-pos-por',
  DEF: 'text-pos-def',
  MID: 'text-pos-mid',
  DEL: 'text-pos-del',
}

const BADGE_TONE = {
  warn: 'bg-[color-mix(in_srgb,#ffd60a_18%,transparent)] text-[color-mix(in_srgb,#ffd60a_82%,var(--text))]',
  danger: 'bg-[color-mix(in_srgb,var(--fall)_18%,transparent)] text-[color-mix(in_srgb,var(--fall)_84%,var(--text))]',
}

const UNTIL_TONE = {
  warn: 'text-[color-mix(in_srgb,#ffd60a_75%,var(--text))]',
  danger: 'text-[color-mix(in_srgb,var(--fall)_78%,var(--text))]',
}

export function StatusBadge({
  status,
  note,
  until,
}: {
  status?: PlayerStatus
  note?: string
  until?: string
}) {
  const info = status ? PLAYER_STATUS[status] : null
  if (!info) return null
  return (
    <span
      className={`shrink-0 rounded-[5px] px-1.5 py-0.5 text-[0.62rem] font-bold tracking-[0.05em] ${BADGE_TONE[info.tone]}`}
      title={statusTitle(note, until)}
    >
      {info.label}
    </span>
  )
}

function statusTitle(note?: string, until?: string): string | undefined {
  return [note, until].filter(Boolean).join(' · ') || undefined
}

// Cuánto dura la baja, para enseñarlo en la fila sin ocupar otra columna. En
// las sanciones la web no publica hasta cuándo, así que ahí se enseña el
// motivo ("Roja directa (2/2)"), que es lo que hay.
export function StatusUntil({ player }: { player: Player }) {
  const text = player.status && (player.statusUntil || player.statusNote)
  if (!player.status || !text) return null
  const tone = PLAYER_STATUS[player.status].tone
  return (
    <span
      className={`truncate text-[0.72rem] font-semibold before:text-muted before:content-['_·_'] ${UNTIL_TONE[tone]}`}
      title={statusTitle(player.statusNote, player.statusUntil)}
    >
      {text}
    </span>
  )
}

export function DifficultyBars({ fixture }: { fixture?: Fixture }) {
  const difficulty = fixtureDifficulty(fixture)
  const color = difficultyColor(difficulty)
  return (
    <span className="flex gap-0.5" role="img" aria-label={`Dificultad del rival ${difficulty} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="h-[3px] w-[9px] rounded-sm"
          style={{ background: i <= difficulty ? color : 'var(--paper-dim)' }}
        />
      ))}
    </span>
  )
}

function Sparkline({ player }: { player: Player }) {
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
    <svg className="h-7 w-full" viewBox="0 0 80 28" preserveAspectRatio="none" aria-hidden="true">
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

export interface PlayerRowProps {
  player: Player
  status: AddCheck
  onAdd: (player: Player) => void
  onRemove: (id: string) => void
  inSquad: boolean
  onSelect: (player: Player) => void
  nextFixture?: Fixture
}

export default function PlayerRow({
  player,
  status,
  onAdd,
  onRemove,
  inSquad,
  onSelect,
  nextFixture,
}: PlayerRowProps) {
  const price = currentPrice(player)
  const delta = todayDelta(player)
  const disabled = !status.ok && !inSquad
  const trend = delta > 0 ? 'text-rise' : delta < 0 ? 'text-fall' : 'text-muted'

  return (
    <li
      className={`player-row ${ROW_GRID} animate-[row-in_var(--duration-slow)_var(--ease-smooth-out)_both] rounded-[10px] border-b border-hairline px-2 py-3 transition-colors duration-200 hover:bg-ink-soft ${
        inSquad ? 'bg-paper-dim' : ''
      }`}
    >
      <span
        className={`rounded border border-current py-0.5 text-center font-display text-[0.72rem] ${POS_COLOR[player.pos]}`}
      >
        {player.pos}
      </span>

      <button className="flex min-w-0 cursor-pointer flex-col p-0 text-left" onClick={() => onSelect(player)}>
        <span className="flex min-w-0 items-center gap-[7px]">
          <span className="truncate text-[0.92rem] font-semibold">{player.name}</span>
          <StatusBadge status={player.status} note={player.statusNote} until={player.statusUntil} />
        </span>
        <span className="flex items-center gap-1.5 truncate text-[0.74rem] text-muted">
          <TeamCrest team={player.team} size={14} />
          {player.team} · {POSITION_LABEL[player.pos]}
          <StatusUntil player={player} />
        </span>
      </button>

      <Sparkline player={player} />

      <span className="text-right font-display text-[0.98rem] tabular-nums">{player.points}</span>

      <span className="text-right text-[0.85rem] tabular-nums text-muted">
        {(player.points / (price / 1_000_000)).toFixed(1).replace('.', ',')}
      </span>

      <span className="flex min-w-0 items-center gap-[7px]">
        {nextFixture ? (
          <>
            <TeamCrest team={nextFixture.opponent} size={16} />
            <span className="flex min-w-0 flex-col gap-[3px]">
              <span className="truncate whitespace-nowrap text-[0.74rem] text-muted">
                {nextFixture.home ? '' : '@ '}
                {nextFixture.opponent}
              </span>
              <span className="flex items-center gap-[7px]">
                <DifficultyBars fixture={nextFixture} />
                <span
                  className="whitespace-nowrap text-[0.72rem] font-semibold tabular-nums"
                  title={`Victoria ${winChance(nextFixture)}% · ${oddsLabel(nextFixture)}`}
                >
                  {winChance(nextFixture)}%
                </span>
              </span>
            </span>
          </>
        ) : (
          <span className="text-[0.74rem] text-muted">—</span>
        )}
      </span>

      <span className="text-right">
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-paper-dim px-2 py-[3px] text-[0.78rem] font-semibold tabular-nums ${trend}`}
        >
          {delta > 0 ? '↑' : delta < 0 ? '↓' : '·'} {formatDeltaShort(delta)}
        </span>
      </span>

      <span className="whitespace-nowrap text-right font-display text-[0.98rem] tabular-nums">
        {formatMillions(price)}
      </span>

      {inSquad ? (
        <button className="btn btn-following" onClick={() => onRemove(player.id)}>
          Siguiendo
        </button>
      ) : (
        <button
          className="btn btn-add"
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

function reasonLabel(reason?: string): string {
  switch (reason) {
    case 'equipo-completo':
      return 'Equipo completo (25)'
    case 'no-autenticado':
      return 'Inicia sesión'
    default:
      return 'No disponible'
  }
}
