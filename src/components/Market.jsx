import { useMemo, useState } from 'react'
import { POSITIONS, POSITION_LABEL, currentPrice, todayDelta } from '../data/mockPlayers'
import PlayerRow from './PlayerRow'

const SORTERS = {
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
          <select className="market__team" value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="TODOS">Todos los equipos</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

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
