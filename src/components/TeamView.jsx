import { useMemo } from 'react'
import { currentPrice, todayDelta } from '../data/mockPlayers'
import { teamValueSeries, teamDailySeries, unionDates } from '../utils/teamStats'
import TeamValueChart from './TeamValueChart'
import TeamDailyBars from './TeamDailyBars'
import { MAX_SQUAD } from '../hooks/useSquad'

export default function TeamView({ squad, totalValue, removePlayer, onSelect, onClear }) {
  const dateRange = useMemo(() => unionDates(squad), [squad])
  const valueSeries = useMemo(() => teamValueSeries(squad, dateRange), [squad, dateRange])
  const dailySeries = useMemo(() => teamDailySeries(squad, dateRange), [squad, dateRange])
  const todayTeamDelta = dailySeries[dailySeries.length - 1]?.delta ?? 0

  if (squad.length === 0) {
    return (
      <section className="team-view team-view--empty">
        <h2>Mi equipo</h2>
        <p>
          Todavía no sigues a ningún jugador. Ve a <strong>Mercado</strong> y pulsa «Seguir» en los que
          quieras controlar — hasta {MAX_SQUAD}.
        </p>
      </section>
    )
  }

  return (
    <section className="team-view">
      <header className="team-view__header">
        <div>
          <h2>Mi equipo</h2>
          <p className="team-view__subtitle">
            {squad.length}/{MAX_SQUAD} jugadores · valor total {totalValue.toFixed(1)}M
          </p>
        </div>
        <span className={`team-view__today ${todayTeamDelta > 0 ? 'is-rise' : todayTeamDelta < 0 ? 'is-fall' : ''}`}>
          {todayTeamDelta > 0 ? '▲' : todayTeamDelta < 0 ? '▼' : '·'} {Math.abs(todayTeamDelta).toFixed(1)}M hoy
        </span>
        <button className="btn btn--ghost-dark" onClick={onClear}>
          Vaciar equipo
        </button>
      </header>

      <div className="team-view__charts">
        <TeamValueChart data={valueSeries} />
        <TeamDailyBars data={dailySeries} />
      </div>

      <ul className="roster">
        {squad.map((p) => {
          const delta = todayDelta(p)
          return (
            <li key={p.id} className="roster__item">
              <button className="roster__name" onClick={() => onSelect(p)}>
                {p.name}
                <span className="roster__team">{p.team}</span>
              </button>
              <span className="roster__price">{currentPrice(p).toFixed(1)}M</span>
              <span className={`roster__delta ${delta > 0 ? 'is-rise' : delta < 0 ? 'is-fall' : ''}`}>
                {delta > 0 ? '+' : ''}
                {delta.toFixed(1)}M
              </span>
              <button className="btn btn--remove" onClick={() => removePlayer(p.id)}>
                Quitar
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
