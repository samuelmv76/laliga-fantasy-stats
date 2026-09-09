import { useEffect, useMemo, useRef, useState } from 'react'
import { POSITIONS, POSITION_LABEL, currentPrice, todayDelta } from '../data/mockPlayers'
import PlayerRow from './PlayerRow'
import TeamCrest from './TeamCrest'

export const SORTERS = {
  puntos: (a, b) => b.points - a.points,
  precio: (a, b) => currentPrice(b) - currentPrice(a),
  ratio: (a, b) => b.points / currentPrice(b) - a.points / currentPrice(a),
  subida: (a, b) => todayDelta(b) - todayDelta(a),
}

export default function Market({ players, squadIds, canAdd, addPlayer, removePlayer, onSelect }) {
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
        <h2>Mercado</h2>
        <input
          className="market__search"
          type="search"
          placeholder="Buscar jugador o equipo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

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

      <ul className="player-list">
        {filtered.map((p) => (
          <PlayerRow
            key={p.id}
            player={p}
            inSquad={squadIds.includes(p.id)}
            status={canAdd(p)}
            onAdd={addPlayer}
            onRemove={removePlayer}
            onSelect={onSelect}
          />
        ))}
        {filtered.length === 0 && <li className="player-list__empty">Ningún jugador coincide con la búsqueda.</li>}
      </ul>
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
