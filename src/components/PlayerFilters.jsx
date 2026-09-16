import { useEffect, useRef } from 'react'
import { PLAYER_STATUS, POSITIONS, POSITION_LABEL } from '../data/mockPlayers'
import { DIFFICULTY_BANDS } from '../utils/playerStats'
import { EMPTY_FILTERS, SORT_LABELS, countActive } from '../utils/playerFilters'
import TeamCrest from './TeamCrest'

// Iconos del filtro de estado. La cruz médica para lesión y la tarjeta para
// sanción son la convención de futbolfantasy, de donde salen los datos, así
// que se reconocen de un vistazo. Cada estado lleva forma propia además de
// color: quien no distinga el rojo del ámbar sigue viendo cuál es cuál.
function StatusIcon({ id }) {
  return (
    <svg className="chip__icon" viewBox="0 0 24 24" aria-hidden="true">
      {id === 'ok' && (
        // Visto: disponible.
        <path d="M20 6.5 9.5 17 4.5 12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {id === 'duda' && (
        // Interrogación: pendiente de saber si llega al partido.
        <>
          <path d="M8.9 8.8a3.2 3.2 0 1 1 4.3 3c-.8.3-1.3 1-1.3 1.9v.6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="18.4" r="1.5" fill="currentColor" />
        </>
      )}
      {id === 'lesion' && (
        // Cruz médica.
        <path d="M9.6 3h4.8v6.6H21v4.8h-6.6V21H9.6v-6.6H3V9.6h6.6z" fill="currentColor" />
      )}
      {id === 'sancion' && (
        // Tarjeta, ligeramente girada como cuando el árbitro la saca.
        <rect x="7" y="3" width="11" height="17" rx="2" fill="currentColor" transform="rotate(10 12 12)" />
      )}
    </svg>
  )
}

// Valor de `status` en el jugador -> etiqueta del filtro. Un jugador
// disponible no trae `status`, de ahí el 'ok' como clave propia. El color es
// el mismo que el del badge de la fila, para que se lean como lo mismo.
const COLOR_BY_TONE = { warn: '#ffd60a', danger: 'var(--fall)' }

const STATUS_FILTERS = [
  { id: 'ok', label: 'Disponible', color: 'var(--rise)' },
  // La etiqueta del badge va en mayúsculas ("LESIÓN"); como filtro se lee
  // mejor normal.
  ...Object.entries(PLAYER_STATUS).map(([id, info]) => ({
    id,
    label: info.label.charAt(0) + info.label.slice(1).toLowerCase(),
    color: COLOR_BY_TONE[info.tone],
  })),
]

// Barra de filtros compartida por el Mercado y Mi equipo. `counts` pone el
// número de jugadores en cada chip; `shortPositions` usa POR/DEF/MID/DEL en
// vez de Portero/Defensa/…, que en el Mercado no caben al lado del número.
export default function PlayerFilters({
  teams,
  filters,
  onChange,
  sortKey,
  onSortChange,
  sortKeys,
  counts,
  shortPositions,
  children,
}) {
  const set = (key, value) => onChange({ ...filters, [key]: value })
  const toggle = (key, value) =>
    onChange({
      ...filters,
      [key]: filters[key].includes(value)
        ? filters[key].filter((v) => v !== value)
        : [...filters[key], value],
    })

  const active = countActive(filters)

  return (
    <div className="market__filters">
      <fieldset className="chip-group">
        <legend className="sr-only">Filtrar por posición</legend>
        <button
          type="button"
          className={`chip${filters.positions.length === 0 ? ' chip--active' : ''}`}
          aria-pressed={filters.positions.length === 0}
          onClick={() => set('positions', [])}
        >
          Todos {counts && <span className="chip__count">{counts.total}</span>}
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
            {shortPositions ? p : POSITION_LABEL[p]}
            {counts && <span className="chip__count">{counts[p] ?? 0}</span>}
          </label>
        ))}
      </fieldset>

      <fieldset className="chip-group">
        <legend className="sr-only">Filtrar por estado</legend>
        {STATUS_FILTERS.map((status) => (
          <label key={status.id} className={`chip${filters.statuses.includes(status.id) ? ' chip--active' : ''}`}>
            <input
              type="checkbox"
              className="sr-only"
              checked={filters.statuses.includes(status.id)}
              onChange={() => toggle('statuses', status.id)}
            />
            <span className="chip__icon-box" style={{ color: status.color }}>
              <StatusIcon id={status.id} />
            </span>
            {status.label}
            {counts && <span className="chip__count">{counts[status.id] ?? 0}</span>}
          </label>
        ))}
      </fieldset>

      {children}

      <div className="market__selects">
        <TeamSelect teams={teams} value={filters.teams} onChange={(value) => set('teams', value)} />

        <select className="market__sort" value={sortKey} onChange={(e) => onSortChange(e.target.value)}>
          {sortKeys.map((key) => (
            <option key={key} value={key}>
              Ordenar: {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <details className="market__advanced">
        <summary className="market__advanced-trigger">
          Más filtros
          {active > 0 && <span className="chip__count">{active}</span>}
        </summary>

        <div className="market__advanced-grid">
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

        <button type="button" className="btn btn--ghost" disabled={active === 0} onClick={() => onChange(EMPTY_FILTERS)}>
          Limpiar filtros
        </button>
      </details>
    </div>
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
