import { useMemo, useState } from 'react'
import { POSITIONS } from '../data/mockPlayers'
import {
  EMPTY_FILTERS,
  SORT_BY_DIFFICULTY,
  SORTERS,
  difficultyByTeam,
  filterPlayers,
  sortPlayers,
} from '../utils/playerFilters'
import PlayerFilters from './PlayerFilters'
import PlayerRow from './PlayerRow'

const SORT_KEYS = [...Object.keys(SORTERS), SORT_BY_DIFFICULTY]

export default function Market({ players, fixtures, squadIds, canAdd, addPlayer, removePlayer, onSelect }) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('puntos')
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const teams = useMemo(() => [...new Set(players.map((p) => p.team))].sort(), [players])
  const difficulty = useMemo(() => difficultyByTeam(teams, fixtures), [teams, fixtures])

  const counts = useMemo(() => {
    const byPosition = { total: players.length }
    for (const p of POSITIONS) byPosition[p] = players.filter((x) => x.pos === p).length
    return byPosition
  }, [players])

  const filtered = useMemo(
    () => sortPlayers(filterPlayers(players, filters, { query, difficulty }), sortKey, difficulty),
    [players, filters, query, sortKey, difficulty]
  )

  return (
    <section className="market">
      <header className="market__header">
        <h2>
          Mercado{' '}
          <span className="market__count">
            {filtered.length} de {players.length} jugadores
          </span>
        </h2>
        <div className="market__search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            className="market__search"
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
      >
        <p className="market__legend">
          <span className="market__legend-item">
            <span className="market__legend-dot" style={{ background: '#ffd60a' }} />
            Duda
          </span>
          <span className="market__legend-item">
            <span className="market__legend-dot" style={{ background: '#ff453a' }} />
            Lesión / sanción
          </span>
        </p>
      </PlayerFilters>

      <div className="market__table">
        <div className="market__table-inner">
          <div className="player-list__head" aria-hidden="true">
            <span>Pos</span>
            <span>Jugador</span>
            <span className="is-center">14 días</span>
            <span className="is-right">Pts</span>
            <span className="is-right">Pts/M€</span>
            <span>Próximo rival</span>
            <span className="is-right">Hoy</span>
            <span className="is-right">Valor</span>
            <span />
          </div>

          <ul className="player-list">
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
              <li className="player-list__empty">Ningún jugador coincide con la búsqueda.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  )
}
