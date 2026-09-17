import { useMemo } from 'react'
import { currentPrice, todayDelta } from '../data/mockPlayers.tsx'
import { formatEuros } from '../utils/format.tsx'
import type { Player } from '../types.tsx'
import TeamCrest from './TeamCrest.tsx'

interface RankingProps {
  players: Player[]
  onSelect: (player: Player) => void
}

export default function Ranking({ players, onSelect }: RankingProps) {
  const sorted = useMemo(() => [...players].sort((a, b) => todayDelta(b) - todayDelta(a)), [players])
  const risers = sorted.filter((p) => todayDelta(p) > 0).slice(0, 8)
  const fallers = [...sorted].reverse().filter((p) => todayDelta(p) < 0).slice(0, 8)

  return (
    <section className="rounded-[22px] border border-hairline bg-[image:var(--paper)] p-5 shadow-float">
      <h2 className="mb-3.5 font-display text-[1.3rem]">Ranking del día</h2>
      <div className="grid gap-5 max-[700px]:grid-cols-1 min-[701px]:grid-cols-2">
        <RankingColumn title="Suben" players={risers} onSelect={onSelect} tone="rise" />
        <RankingColumn title="Bajan" players={fallers} onSelect={onSelect} tone="fall" />
      </div>
    </section>
  )
}

function RankingColumn({
  title,
  players,
  onSelect,
  tone,
}: RankingProps & { title: string; tone: 'rise' | 'fall' }) {
  return (
    <div>
      <h3 className={`mb-1.5 font-display text-base font-medium ${tone === 'rise' ? 'text-rise' : 'text-fall'}`}>
        {title}
      </h3>
      <ol className="m-0 list-none p-0">
        {players.map((p, i) => {
          const delta = todayDelta(p)
          return (
            <li
              key={p.id}
              className="ranking-row grid grid-cols-[20px_minmax(0,1fr)_100px_80px] items-center gap-2 border-b border-hairline py-[7px]"
            >
              <span className="font-display text-[0.82rem] text-muted">{i + 1}</span>
              <button
                className="flex min-w-0 cursor-pointer flex-col p-0 text-left text-[0.88rem] font-semibold text-text"
                onClick={() => onSelect(p)}
              >
                {p.name}
                <span className="flex items-center gap-1 text-[0.72rem] font-normal text-muted">
                  <TeamCrest team={p.team} size={12} />
                  {p.team}
                </span>
              </button>
              <span className="whitespace-nowrap text-right font-display text-[0.85rem] tabular-nums">
                {formatEuros(currentPrice(p))}
              </span>
              <span
                className={`whitespace-nowrap text-right font-display text-[0.88rem] tabular-nums ${
                  tone === 'rise' ? 'text-rise' : 'text-fall'
                }`}
              >
                {delta > 0 ? '+' : ''}
                {formatEuros(delta)}
              </span>
            </li>
          )
        })}
        {players.length === 0 && <li className="py-2.5 text-muted">Sin movimientos hoy.</li>}
      </ol>
    </div>
  )
}
