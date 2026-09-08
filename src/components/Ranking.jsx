import { useMemo } from 'react'
import { currentPrice, todayDelta } from '../data/mockPlayers'
import { formatEuros } from '../utils/format'

export default function Ranking({ players, onSelect }) {
  const sorted = useMemo(() => [...players].sort((a, b) => todayDelta(b) - todayDelta(a)), [players])
  const risers = sorted.filter((p) => todayDelta(p) > 0).slice(0, 8)
  const fallers = [...sorted].reverse().filter((p) => todayDelta(p) < 0).slice(0, 8)

  return (
    <section className="ranking">
      <h2>Ranking del día</h2>
      <div className="ranking__columns">
        <RankingColumn title="Suben" players={risers} onSelect={onSelect} tone="rise" />
        <RankingColumn title="Bajan" players={fallers} onSelect={onSelect} tone="fall" />
      </div>
    </section>
  )
}

function RankingColumn({ title, players, onSelect, tone }) {
  return (
    <div className="ranking__col">
      <h3 className={`ranking__col-title is-${tone}`}>{title}</h3>
      <ol className="ranking__list">
        {players.map((p, i) => {
          const delta = todayDelta(p)
          return (
            <li key={p.id}>
              <span className="ranking__rank">{i + 1}</span>
              <button className="ranking__name" onClick={() => onSelect(p)}>
                {p.name}
                <span className="ranking__team">{p.team}</span>
              </button>
              <span className="ranking__price">{formatEuros(currentPrice(p))}</span>
              <span className={`ranking__delta is-${tone}`}>
                {delta > 0 ? '+' : ''}
                {formatEuros(delta)}
              </span>
            </li>
          )
        })}
        {players.length === 0 && <li className="ranking__empty">Sin movimientos hoy.</li>}
      </ol>
    </div>
  )
}
