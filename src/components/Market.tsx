import { useMemo, useState } from 'react'
import {
  EMPTY_FILTERS,
  SORT_BY_DIFFICULTY,
  SORTERS,
  difficultyByTeam,
  filterCounts,
  filterPlayers,
  sortPlayers,
} from '../utils/playerFilters.tsx'
import type { Filters, SortKey } from '../utils/playerFilters.tsx'
import type { AddCheck, FixturesByTeam, Player } from '../types.tsx'
import PlayerFilters from './PlayerFilters.tsx'
import PlayerRow, { ROW_GRID } from './PlayerRow.tsx'

const SORT_KEYS = [...Object.keys(SORTERS), SORT_BY_DIFFICULTY]

interface MarketProps {
  players: Player[]
  fixtures?: FixturesByTeam
  squadIds: string[]
  canAdd: (player: Player) => AddCheck
  addPlayer: (player: Player) => void
  removePlayer: (id: string) => void
  onSelect: (player: Player) => void
}

export default function Market({
  players,
  fixtures,
  squadIds,
  canAdd,
  addPlayer,
  removePlayer,
  onSelect,
}: MarketProps) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('puntos')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  const teams = useMemo(() => [...new Set(players.map((p) => p.team))].sort(), [players])
  const difficulty = useMemo(() => difficultyByTeam(teams, fixtures), [teams, fixtures])

  const counts = useMemo(() => filterCounts(players), [players])

  const filtered = useMemo(
    () => sortPlayers(filterPlayers(players, filters, { query, difficulty }), sortKey, difficulty),
    [players, filters, query, sortKey, difficulty]
  )

  return (
    <section className="card px-5 pt-[18px] pb-2">
      <header className="mb-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 className="m-0 font-display text-[1.3rem] font-semibold">
          Mercado{' '}
          <span className="text-[0.8rem] font-medium tabular-nums text-muted">
            {filtered.length} de {players.length} jugadores
          </span>
        </h2>
        <div className="relative flex items-center text-muted">
          <svg className="pointer-events-none absolute left-[11px]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            className="w-[238px] max-w-full flex-1 rounded-[11px] border border-hairline bg-[color-mix(in_srgb,var(--ink)_70%,transparent)] py-2 pr-3 pl-8 font-body text-[0.9rem] text-text transition-colors duration-200 focus:border-turf-line"
            type="search"
            placeholder="Buscar jugador o equipo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <PlayerFilters
        teams={teams}
        filters={filters}
        onChange={setFilters}
        sortKey={sortKey}
        onSortChange={setSortKey}
        sortKeys={SORT_KEYS}
        counts={counts}
        shortPositions
      />

      <div className="overflow-x-auto">
        <div className="market-table min-w-[880px]">
          <div
            className={`market-head ${ROW_GRID} border-b border-hairline px-2 pb-2 text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-muted`}
            aria-hidden="true"
          >
            <span>Pos</span>
            <span>Jugador</span>
            <span className="text-center">14 días</span>
            <span className="text-right">Pts</span>
            <span className="text-right">Pts/M€</span>
            <span>Próximo rival</span>
            <span className="text-right">Hoy</span>
            <span className="text-right">Valor</span>
            <span />
          </div>

          <ul className="m-0 list-none p-0">
            {filtered.map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                nextFixture={fixtures?.[p.team]?.[0]}
                inSquad={squadIds.includes(p.id)}
                status={canAdd(p)}
                onAdd={addPlayer}
                onRemove={removePlayer}
                onSelect={onSelect}
              />
            ))}
            {filtered.length === 0 && (
              <li className="py-6 text-center text-muted">Ningún jugador coincide con la búsqueda.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  )
}
