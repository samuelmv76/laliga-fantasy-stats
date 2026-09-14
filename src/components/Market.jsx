import { useEffect, useMemo, useRef, useState } from 'react'
import { POSITIONS, currentPrice, todayDelta } from '../data/mockPlayers'
import PlayerRow from './PlayerRow'
import TeamCrest from './TeamCrest'

export const SORTERS = {
  puntos: (a, b) => b.points - a.points,
  precio: (a, b) => currentPrice(b) - currentPrice(a),
  ratio: (a, b) => b.points / currentPrice(b) - a.points / currentPrice(a),
  subida: (a, b) => todayDelta(b) - todayDelta(a),
}

export default function Market({ players, fixtures, squadIds, canAdd, addPlayer, removePlayer, onSelect }) {
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState('TODOS')
  const [team, setTeam] = useState('TODOS')
  const [sortKey, setSortKey] = useState('puntos')

  const teams = useMemo(() => [...new Set(players.map((p) => p.team))].sort(), [players])

  const filtered = useMemo(() => {
    return players
      .filter((p) => (pos === 'TODOS' ? true : p.pos === pos))
      .filter((p) => (team === 'TODOS' ? true : p.team === team))
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.team.toLowerCase().includes(query.toLowerCase()))
      .sort(SORTERS[sortKey])
  }, [players, pos, team, query, sortKey])

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

      <div className="market__filters">
        <div className="chip-group" role="tablist" aria-label="Filtrar por posición">
          <button className={`chip${pos === 'TODOS' ? ' chip--active' : ''}`} onClick={() => setPos('TODOS')}>
            Todos <span className="chip__count">{players.length}</span>
          </button>
          {POSITIONS.map((p) => (
            <button key={p} className={`chip${pos === p ? ' chip--active' : ''}`} onClick={() => setPos(p)}>
              <span className="chip__dot" style={{ background: `var(--pos-${p.toLowerCase()})` }} />
              {p}
              <span className="chip__count">{players.filter((x) => x.pos === p).length}</span>
            </button>
          ))}
        </div>

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

export function TeamSelect({ teams, value, onChange }) {
  const ref = useRef(null)

  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) ref.current.open = false
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function choose(t) {
    onChange(t)
    if (ref.current) ref.current.open = false
  }

  return (
    <details className="team-select" ref={ref}>
      <summary className="team-select__trigger">
        {value !== 'TODOS' && <TeamCrest team={value} size={16} />}
        <span>{value === 'TODOS' ? 'Todos los equipos' : value}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="team-select__menu" role="listbox" aria-label="Equipo">
        <button
          type="button"
          role="option"
          aria-selected={value === 'TODOS'}
          className={`team-select__option${value === 'TODOS' ? ' is-active' : ''}`}
          onClick={() => choose('TODOS')}
        >
          Todos los equipos
        </button>
        {teams.map((t) => (
          <button
            key={t}
            type="button"
            role="option"
            aria-selected={value === t}
            className={`team-select__option${value === t ? ' is-active' : ''}`}
            onClick={() => choose(t)}
          >
            <TeamCrest team={t} size={16} />
            {t}
          </button>
        ))}
      </div>
    </details>
  )
}
