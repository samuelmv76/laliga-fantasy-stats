import { useEffect, useMemo, useRef, useState } from 'react'
import { PLAYER_STATUS, POSITIONS, currentPrice, todayDelta } from '../data/mockPlayers'
import {
  DIFFICULTY_BANDS,
  difficultyBand,
  form,
  fromPeak,
  nextDifficulty,
  pointsAverage,
  pointsPerMillion,
  priceDelta,
} from '../utils/playerStats'
import PlayerRow from './PlayerRow'
import TeamCrest from './TeamCrest'

export const SORTERS = {
  puntos: (a, b) => b.points - a.points,
  media: (a, b) => pointsAverage(b) - pointsAverage(a),
  forma: (a, b) => form(b) - form(a),
  precio: (a, b) => currentPrice(b) - currentPrice(a),
  ratio: (a, b) => pointsPerMillion(b) - pointsPerMillion(a),
  subida: (a, b) => todayDelta(b) - todayDelta(a),
  subida7: (a, b) => priceDelta(b, 7) - priceDelta(a, 7),
  rebaja: (a, b) => fromPeak(a) - fromPeak(b),
}

// Este orden necesita el calendario del equipo, así que no cabe en SORTERS
// (que solo recibe dos jugadores) y se resuelve aparte en el useMemo.
const SORT_BY_DIFFICULTY = 'dificultad'

// Valor de `status` en el jugador -> etiqueta del filtro. Un jugador
// disponible no trae `status`, de ahí el 'ok' como clave propia.
const STATUS_FILTERS = [
  { id: 'ok', label: 'Disponible' },
  // La etiqueta del badge va en mayúsculas ("LESIÓN"); en una lista de
  // filtros se lee mejor normal.
  ...Object.entries(PLAYER_STATUS).map(([id, info]) => ({
    id,
    label: info.label.charAt(0) + info.label.slice(1).toLowerCase(),
  })),
]

const EMPTY_FILTERS = {
  positions: [],
  teams: [],
  statuses: [],
  difficulties: [],
  minPrice: '',
  maxPrice: '',
  minPoints: '',
  minAverage: '',
  minForm: '',
}

// '' o basura -> null, para poder distinguir "sin filtro" de "filtra por 0".
function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function countActive(filters) {
  return Object.values(filters).reduce((total, value) => {
    if (Array.isArray(value)) return total + (value.length > 0 ? 1 : 0)
    return total + (numberOrNull(value) === null ? 0 : 1)
  }, 0)
}

export default function Market({ players, fixtures, squadIds, canAdd, addPlayer, removePlayer, onSelect }) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('puntos')
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const set = (key, value) => setFilters((current) => ({ ...current, [key]: value }))
  const toggle = (key, value) =>
    setFilters((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((v) => v !== value)
        : [...current[key], value],
    }))

  const teams = useMemo(() => [...new Set(players.map((p) => p.team))].sort(), [players])

  // Dificultad media de los próximos 3 partidos, una vez por equipo en vez
  // de una vez por jugador.
  const difficultyByTeam = useMemo(() => {
    const byTeam = {}
    for (const team of teams) byTeam[team] = nextDifficulty(fixtures?.[team])
    return byTeam
  }, [teams, fixtures])

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    const minPrice = numberOrNull(filters.minPrice)
    const maxPrice = numberOrNull(filters.maxPrice)
    const minPoints = numberOrNull(filters.minPoints)
    const minAverage = numberOrNull(filters.minAverage)
    const minForm = numberOrNull(filters.minForm)

    const result = players.filter((player) => {
      if (filters.positions.length > 0 && !filters.positions.includes(player.pos)) return false
      if (filters.teams.length > 0 && !filters.teams.includes(player.team)) return false
      if (filters.statuses.length > 0 && !filters.statuses.includes(player.status ?? 'ok')) return false
      if (filters.difficulties.length > 0) {
        const band = difficultyBand(difficultyByTeam[player.team])
        if (band === null || !filters.difficulties.includes(band)) return false
      }

      const price = currentPrice(player) / 1_000_000
      if (minPrice !== null && price < minPrice) return false
      if (maxPrice !== null && price > maxPrice) return false
      if (minPoints !== null && player.points < minPoints) return false
      if (minAverage !== null && pointsAverage(player) < minAverage) return false
      if (minForm !== null && form(player) < minForm) return false

      if (text && !player.name.toLowerCase().includes(text) && !player.team.toLowerCase().includes(text)) {
        return false
      }
      return true
    })

    if (sortKey === SORT_BY_DIFFICULTY) {
      // Sin calendario, al final: no es "fácil", es que no se sabe.
      const value = (player) => difficultyByTeam[player.team] ?? Infinity
      return result.sort((a, b) => value(a) - value(b))
    }
    return result.sort(SORTERS[sortKey])
  }, [players, filters, query, sortKey, difficultyByTeam])

  const active = countActive(filters)

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
        <fieldset className="chip-group">
          <legend className="sr-only">Filtrar por posición</legend>
          <button
            type="button"
            className={`chip${filters.positions.length === 0 ? ' chip--active' : ''}`}
            aria-pressed={filters.positions.length === 0}
            onClick={() => set('positions', [])}
          >
            Todos <span className="chip__count">{players.length}</span>
          </button>
          {POSITIONS.map((p) => (
            <label key={p} className={`chip${filters.positions.includes(p) ? ' chip--active' : ''}`}>
              <input
                type="checkbox"
                className="sr-only"
                checked={filters.positions.includes(p)}
                onChange={() => toggle('positions', p)}
              />
              <span className="chip__dot" style={{ background: `var(--pos-${p.toLowerCase()})` }} />
              {p}
              <span className="chip__count">{players.filter((x) => x.pos === p).length}</span>
            </label>
          ))}
        </fieldset>

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
          <TeamSelect teams={teams} value={filters.teams} onChange={(value) => set('teams', value)} />

          <select className="market__sort" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            <option value="puntos">Ordenar: puntos</option>
            <option value="media">Ordenar: media por partido</option>
            <option value="forma">Ordenar: forma (últimas 3 J)</option>
            <option value="precio">Ordenar: precio</option>
            <option value="ratio">Ordenar: puntos/millón</option>
            <option value="subida">Ordenar: subida de hoy</option>
            <option value="subida7">Ordenar: subida de 7 días</option>
            <option value="rebaja">Ordenar: más lejos de su máximo</option>
            <option value={SORT_BY_DIFFICULTY}>Ordenar: calendario más fácil</option>
          </select>
        </div>

        <details className="market__advanced">
          <summary className="market__advanced-trigger">
            Más filtros
            {active > 0 && <span className="chip__count">{active}</span>}
          </summary>

          <div className="market__advanced-grid">
            <CheckGroup
              legend="Estado"
              options={STATUS_FILTERS}
              selected={filters.statuses}
              onToggle={(id) => toggle('statuses', id)}
            />

            <CheckGroup
              legend="Calendario (próx. 3 partidos)"
              options={DIFFICULTY_BANDS}
              selected={filters.difficulties}
              onToggle={(id) => toggle('difficulties', id)}
            />

            <fieldset className="filter-group">
              <legend>Precio (M€)</legend>
              <div className="filter-group__row">
                <NumberFilter label="Desde" value={filters.minPrice} step="0.5" onChange={(v) => set('minPrice', v)} />
                <NumberFilter label="Hasta" value={filters.maxPrice} step="0.5" onChange={(v) => set('maxPrice', v)} />
              </div>
            </fieldset>

            <fieldset className="filter-group">
              <legend>Rendimiento mínimo</legend>
              <div className="filter-group__row">
                <NumberFilter label="Puntos" value={filters.minPoints} step="1" onChange={(v) => set('minPoints', v)} />
                <NumberFilter label="Media" value={filters.minAverage} step="0.5" onChange={(v) => set('minAverage', v)} />
                <NumberFilter label="Forma" value={filters.minForm} step="1" onChange={(v) => set('minForm', v)} />
              </div>
            </fieldset>
          </div>

          <button type="button" className="btn btn--ghost" disabled={active === 0} onClick={() => setFilters(EMPTY_FILTERS)}>
            Limpiar filtros
          </button>
        </details>
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

function CheckGroup({ legend, options, selected, onToggle }) {
  return (
    <fieldset className="filter-group">
      <legend>{legend}</legend>
      <div className="filter-group__checks">
        {options.map((option) => (
          <label key={option.id} className="filter-check">
            <input
              type="checkbox"
              checked={selected.includes(option.id)}
              onChange={() => onToggle(option.id)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function NumberFilter({ label, value, step, onChange }) {
  return (
    <label className="filter-number">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
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

  function toggle(team) {
    onChange(value.includes(team) ? value.filter((t) => t !== team) : [...value, team])
  }

  const label =
    value.length === 0 ? 'Todos los equipos' : value.length === 1 ? value[0] : `${value.length} equipos`

  return (
    <details className="team-select" ref={ref}>
      <summary className="team-select__trigger">
        {value.length === 1 && <TeamCrest team={value[0]} size={16} />}
        <span>{label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <fieldset className="team-select__menu">
        <legend className="sr-only">Equipos</legend>
        <button
          type="button"
          className="team-select__option team-select__clear"
          disabled={value.length === 0}
          onClick={() => onChange([])}
        >
          Todos los equipos
        </button>
        {teams.map((t) => (
          <label key={t} className={`team-select__option${value.includes(t) ? ' is-active' : ''}`}>
            <input type="checkbox" checked={value.includes(t)} onChange={() => toggle(t)} />
            <TeamCrest team={t} size={16} />
            {t}
          </label>
        ))}
      </fieldset>
    </details>
  )
}
