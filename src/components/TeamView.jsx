import { useEffect, useMemo, useState } from 'react'
import { SignInButton, useAuth } from '@clerk/react'
import { currentPrice, todayDelta } from '../data/mockPlayers'
import { teamValueSeries, teamDailySeries, unionDates } from '../utils/teamStats'
import { formatEuros } from '../utils/format'
import { formatEurosCompact } from '../utils/format'
import TeamValueChart from './TeamValueChart'
import TeamDailyBars from './TeamDailyBars'
import TeamCrest from './TeamCrest'
import {
  EMPTY_FILTERS,
  SORT_BY_DIFFICULTY,
  SORTERS,
  difficultyByTeam,
  filterPlayers,
  sortPlayers,
} from '../utils/playerFilters'
import PlayerFilters from './PlayerFilters'
import { StatusBadge, StatusUntil } from './PlayerRow'
import { MAX_SQUAD } from '../hooks/useSquad'
import { StatCards } from './spectrumui/charts/stat-cards'

const SORT_KEYS = [...Object.keys(SORTERS), SORT_BY_DIFFICULTY]

export default function TeamView({ squad, fixtures, totalValue, removePlayer, onSelect, onAddPlayer, teamName, onRenameTeam }) {
  const { isLoaded, isSignedIn } = useAuth()
  const [nameDraft, setNameDraft] = useState(teamName)
  useEffect(() => setNameDraft(teamName), [teamName])
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('puntos')
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const teams = useMemo(() => [...new Set(squad.map((p) => p.team))].sort(), [squad])
  const difficulty = useMemo(() => difficultyByTeam(teams, fixtures), [teams, fixtures])

  const dateRange = useMemo(() => unionDates(squad), [squad])
  const valueSeries = useMemo(() => teamValueSeries(squad, dateRange), [squad, dateRange])
  const dailySeries = useMemo(() => teamDailySeries(squad, dateRange), [squad, dateRange])
  const todayTeamDelta = dailySeries[dailySeries.length - 1]?.delta ?? 0

  const filtered = useMemo(
    () => sortPlayers(filterPlayers(squad, filters, { query, difficulty }), sortKey, difficulty),
    [squad, filters, query, sortKey, difficulty]
  )

  // Sin sesión no hay equipo que enseñar: el equipo se guarda en la cuenta,
  // no en el navegador. Hasta que Clerk responde no se dice nada, para no
  // enseñar «inicia sesión» a quien ya la tiene iniciada.
  if (isLoaded && !isSignedIn) {
    return (
      <section className="team-view team-view--empty">
        <h2>{teamName}</h2>
        <p>
          Para tener equipo necesitas <strong>iniciar sesión</strong>. Tu plantilla se guarda en tu
          cuenta, así que la tienes igual desde cualquier dispositivo y no se pierde al cerrar el
          navegador.
        </p>
        <p>
          Mientras tanto puedes usar el <strong>Mercado</strong>: precios, puntos, estadísticas y
          calendario se ven sin cuenta.
        </p>
        <SignInButton mode="modal">
          <button type="button" className="btn btn--add team-view__signin">
            Iniciar sesión
          </button>
        </SignInButton>
      </section>
    )
  }

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

      <PlayerFilters
        teams={teams}
        filters={filters}
        onChange={setFilters}
        sortKey={sortKey}
        onSortChange={setSortKey}
        sortKeys={SORT_KEYS}
      >
        <input
          className="market__search"
          type="search"
          placeholder="Buscar en mi equipo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </PlayerFilters>

      <ul className="roster">
        {filtered.length === 0 && <li className="player-list__empty">Ningún jugador coincide con el filtro.</li>}
        {filtered.map((p) => {
          const delta = todayDelta(p)
          return (
            <li key={p.id} className="roster__item">
              <button className="roster__name" onClick={() => onSelect(p)}>
                <span className="player-row__name-line">
                  {p.name}
                  <StatusBadge status={p.status} note={p.statusNote} until={p.statusUntil} />
                </span>
                <span className="roster__team">
                  <TeamCrest team={p.team} size={14} />
                  {p.team}
                  <StatusUntil player={p} />
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
