import { useEffect, useMemo, useState } from 'react'
import { SignInButton, useAuth } from '@clerk/react'
import { currentPrice, todayDelta } from '../data/mockPlayers.tsx'
import { teamValueSeries, teamDailySeries, unionDates } from '../utils/teamStats.tsx'
import { formatEuros, formatEurosCompact } from '../utils/format.tsx'
import type { FixturesByTeam, Player } from '../types.tsx'
import TeamValueChart from './TeamValueChart.tsx'
import TeamDailyBars from './TeamDailyBars.tsx'
import TeamCrest from './TeamCrest.tsx'
import {
  EMPTY_FILTERS,
  SORT_BY_DIFFICULTY,
  SORTERS,
  difficultyByTeam,
  filterCounts,
  filterPlayers,
  sortPlayers,
} from '../utils/playerFilters'
import PlayerFilters from './PlayerFilters'
import { StatusBadge, StatusUntil } from './PlayerRow'
import { MAX_SQUAD } from '../hooks/useSquad'
import { StatCards } from './spectrumui/charts/stat-cards'

const EMPTY_CARD = 'card px-5 py-12 text-center text-muted'
const EMPTY_TEXT = 'mx-auto my-2.5 max-w-[46ch]'

const SORT_KEYS = [...Object.keys(SORTERS), SORT_BY_DIFFICULTY]

interface TeamViewProps {
  squad: Player[]
  fixtures?: FixturesByTeam
  totalValue: number
  removePlayer: (id: string) => void
  onSelect: (player: Player) => void
  onAddPlayer: () => void
  teamName: string
  onRenameTeam: (name: string) => void
}

export default function TeamView({
  squad,
  fixtures,
  totalValue,
  removePlayer,
  onSelect,
  onAddPlayer,
  teamName,
  onRenameTeam,
}: TeamViewProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const [nameDraft, setNameDraft] = useState(teamName)
  useEffect(() => setNameDraft(teamName), [teamName])
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('puntos')
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const teams = useMemo(() => [...new Set(squad.map((p) => p.team))].sort(), [squad])
  const difficulty = useMemo(() => difficultyByTeam(teams, fixtures), [teams, fixtures])
  const counts = useMemo(() => filterCounts(squad), [squad])

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
      <section className={EMPTY_CARD}>
        <h2 className="font-display">{teamName}</h2>
        <p className={EMPTY_TEXT}>
          Para tener equipo necesitas <strong>iniciar sesión</strong>. Tu plantilla se guarda en tu
          cuenta, así que la tienes igual desde cualquier dispositivo y no se pierde al cerrar el
          navegador.
        </p>
        <p className={EMPTY_TEXT}>
          Mientras tanto puedes usar el <strong>Mercado</strong>: precios, puntos, estadísticas y
          calendario se ven sin cuenta.
        </p>
        <SignInButton mode="modal">
          <button type="button" className="btn btn-add mt-1.5">
            Iniciar sesión
          </button>
        </SignInButton>
      </section>
    )
  }

  if (squad.length === 0) {
    return (
      <section className={EMPTY_CARD}>
        <h2 className="font-display">{teamName}</h2>
        <p className={EMPTY_TEXT}>
          Todavía no sigues a ningún jugador. Ve a <strong>Mercado</strong> y pulsa «Seguir» en los que
          quieras controlar — hasta {MAX_SQUAD}.
        </p>
      </section>
    )
  }

  return (
    <section className="card p-5">
      <header className="mb-[18px] flex flex-wrap items-center gap-3.5">
        <div>
          <input
            className="m-0 mb-0.5 max-w-full rounded-lg border border-transparent bg-transparent px-1.5 py-0.5 font-display text-[1.3rem] font-semibold text-text hover:border-paper-dim hover:bg-paper-dim focus:border-paper-dim focus:bg-paper-dim focus:outline-none"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => nameDraft.trim() && nameDraft !== teamName && onRenameTeam(nameDraft.trim())}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            maxLength={40}
            aria-label="Nombre del equipo"
          />
          <p className="m-0 text-[0.85rem] text-muted">
            {squad.length}/{MAX_SQUAD} jugadores · valor total {formatEuros(totalValue)}
          </p>
        </div>
      </header>

      <StatCards
        className="mb-4"
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

      <div className="mb-5 grid gap-4 max-[760px]:grid-cols-1 min-[761px]:grid-cols-2">
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
        counts={counts}
      >
        <input
          className="w-[238px] max-w-full flex-1 rounded-[11px] border border-hairline bg-[color-mix(in_srgb,var(--ink)_70%,transparent)] px-3 py-2 font-body text-[0.9rem] text-text transition-colors duration-200 focus:border-turf-line"
          type="search"
          placeholder="Buscar en mi equipo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </PlayerFilters>

      <ul className="m-0 list-none border-t border-hairline p-0">
        {filtered.length === 0 && (
          <li className="py-6 text-center text-muted">Ningún jugador coincide con el filtro.</li>
        )}
        {filtered.map((p) => {
          const delta = todayDelta(p)
          return (
            <li
              key={p.id}
              className="roster-row grid animate-[row-in_var(--duration-slow)_var(--ease-smooth-out)_both] grid-cols-[1fr_60px_92px_78px_78px] items-center gap-2.5 rounded-[10px] border-b border-hairline px-2 py-[11px] transition-colors duration-200 hover:bg-ink-soft"
            >
              <button
                className="flex cursor-pointer flex-col p-0 text-left text-[0.92rem] font-semibold text-text"
                onClick={() => onSelect(p)}
              >
                <span className="flex min-w-0 items-center gap-[7px]">
                  {p.name}
                  <StatusBadge status={p.status} note={p.statusNote} until={p.statusUntil} />
                </span>
                <span className="flex items-center gap-[5px] text-[0.75rem] font-normal text-muted">
                  <TeamCrest team={p.team} size={14} />
                  {p.team}
                  <StatusUntil player={p} />
                </span>
              </button>
              <span className="text-right text-[0.85rem] text-muted">{p.points} pts</span>
              <span className="mr-1.5 whitespace-nowrap text-right font-display tabular-nums">
                {formatEuros(currentPrice(p))}
              </span>
              <span
                className={`whitespace-nowrap text-right font-display text-[0.88rem] tabular-nums ${
                  delta > 0 ? 'text-rise' : delta < 0 ? 'text-fall' : ''
                }`}
              >
                {delta > 0 ? '+' : ''}
                {formatEuros(delta)}
              </span>
              <button className="btn btn-remove" onClick={() => removePlayer(p.id)}>
                Quitar
              </button>
            </li>
          )
        })}
      </ul>

      <button className="btn btn-ghost-dark mt-3.5 block w-full" onClick={onAddPlayer}>
        + Añadir jugador
      </button>
    </section>
  )
}
