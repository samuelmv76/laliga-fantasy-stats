import { useEffect, useMemo, useState } from 'react'
import { POSITIONS, POSITION_LABEL, currentPrice, todayDelta } from '../data/mockPlayers'
import { teamValueSeries, teamDailySeries, unionDates } from '../utils/teamStats'
import { formatEuros } from '../utils/format'
import { formatEurosCompact } from '../utils/format'
import TeamValueChart from './TeamValueChart'
import TeamDailyBars from './TeamDailyBars'
import TeamCrest from './TeamCrest'
import { SORTERS, TeamSelect } from './Market'
import { StatusBadge } from './PlayerRow'
import { MAX_SQUAD } from '../hooks/useSquad'
import { StatCards } from './spectrumui/charts/stat-cards'

export default function TeamView({ squad, totalValue, removePlayer, onSelect, onAddPlayer, teamName, onRenameTeam }) {
  const [nameDraft, setNameDraft] = useState(teamName)
  useEffect(() => setNameDraft(teamName), [teamName])
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState('TODOS')
  const [team, setTeam] = useState('TODOS')
  const [sortKey, setSortKey] = useState('puntos')

  const teams = useMemo(() => [...new Set(squad.map((p) => p.team))].sort(), [squad])

  const dateRange = useMemo(() => unionDates(squad), [squad])
  const valueSeries = useMemo(() => teamValueSeries(squad, dateRange), [squad, dateRange])
  const dailySeries = useMemo(() => teamDailySeries(squad, dateRange), [squad, dateRange])
  const todayTeamDelta = dailySeries[dailySeries.length - 1]?.delta ?? 0

  const filtered = useMemo(() => {
    return squad
      .filter((p) => (pos === 'TODOS' ? true : p.pos === pos))
      .filter((p) => (team === 'TODOS' ? true : p.team === team))
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.team.toLowerCase().includes(query.toLowerCase()))
      .sort(SORTERS[sortKey])
  }, [squad, pos, team, query, sortKey])

  if (squad.length === 0) {
    return (
      <section className="team-view team-view--empty">
        <h2>{teamName}</h2>
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
          <input
            className="team-view__name"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => nameDraft.trim() && nameDraft !== teamName && onRenameTeam(nameDraft.trim())}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            maxLength={40}
            aria-label="Nombre del equipo"
          />
          <p className="team-view__subtitle">
            {squad.length}/{MAX_SQUAD} jugadores · valor total {formatEuros(totalValue)}
          </p>
        </div>
      </header>

      <StatCards
        className="team-view__stat-cards"
        columns={2}
        cards={[
          {
            label: 'Valor total del equipo',
            series: valueSeries.map((d) => d.value),
            format: formatEurosCompact,
            deltaLabel: 'vs inicio del historial',
          },
          {
            label: 'Variación hoy',
            value: todayTeamDelta,
            caption: `${squad.length}/${MAX_SQUAD} jugadores`,
            format: formatEurosCompact,
          },
        ]}
      />

      <div className="team-view__charts">
        <TeamValueChart data={valueSeries} />
        <TeamDailyBars data={dailySeries} />
      </div>

      <div className="market__filters">
        <div className="chip-group" role="tablist" aria-label="Filtrar por posición">
          <button className={`chip${pos === 'TODOS' ? ' chip--active' : ''}`} onClick={() => setPos('TODOS')}>
            Todos
          </button>
          {POSITIONS.map((p) => (
            <button key={p} className={`chip${pos === p ? ' chip--active' : ''}`} onClick={() => setPos(p)}>
              {POSITION_LABEL[p]}
            </button>
          ))}
        </div>
        <input
          className="market__search"
          type="search"
          placeholder="Buscar en mi equipo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="market__selects">
          <TeamSelect teams={teams} value={team} onChange={setTeam} />
          <select className="market__sort" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            <option value="puntos">Ordenar: puntos</option>
            <option value="precio">Ordenar: precio</option>
            <option value="ratio">Ordenar: puntos/millón</option>
            <option value="subida">Ordenar: subida de hoy</option>
          </select>
        </div>
      </div>

      <ul className="roster">
        {filtered.length === 0 && <li className="player-list__empty">Ningún jugador coincide con el filtro.</li>}
        {filtered.map((p) => {
          const delta = todayDelta(p)
          return (
            <li key={p.id} className="roster__item">
              <button className="roster__name" onClick={() => onSelect(p)}>
                <span className="player-row__name-line">
                  {p.name}
                  <StatusBadge status={p.status} />
                </span>
                <span className="roster__team">
                  <TeamCrest team={p.team} size={14} />
                  {p.team}
                </span>
              </button>
              <span className="roster__points">{p.points} pts</span>
              <span className="roster__price">{formatEuros(currentPrice(p))}</span>
              <span className={`roster__delta ${delta > 0 ? 'is-rise' : delta < 0 ? 'is-fall' : ''}`}>
                {delta > 0 ? '+' : ''}
                {formatEuros(delta)}
              </span>
              <button className="btn btn--remove" onClick={() => removePlayer(p.id)}>
                Quitar
              </button>
            </li>
          )
        })}
      </ul>

      <button className="btn btn--ghost-dark team-view__add" onClick={onAddPlayer}>
        + Añadir jugador
      </button>
    </section>
  )
}
