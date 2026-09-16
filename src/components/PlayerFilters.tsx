import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { PLAYER_STATUS, POSITIONS, POSITION_LABEL } from '../data/mockPlayers.tsx'
import { DIFFICULTY_BANDS } from '../utils/playerStats.tsx'
import { EMPTY_FILTERS, SORT_LABELS, countActive } from '../utils/playerFilters.tsx'
import type { FilterCounts, Filters, SortKey } from '../utils/playerFilters.tsx'
import TeamCrest from './TeamCrest.tsx'

// Iconos del filtro de estado. La cruz médica para lesión y la tarjeta para
// sanción son la convención de futbolfantasy, de donde salen los datos, así
// que se reconocen de un vistazo. Cada estado lleva forma propia además de
// color: quien no distinga el rojo del ámbar sigue viendo cuál es cuál.
function StatusIcon({ id }: { id: string }) {
  return (
    <svg className="size-[13px]" viewBox="0 0 24 24" aria-hidden="true">
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

const FILTER_GROUP = 'border-0 m-0 p-0 [min-inline-size:0]'
const FILTER_LEGEND = 'pb-[7px] text-[0.74rem] font-bold uppercase tracking-[0.04em] text-muted'
const CHIP_COUNT = 'font-medium tabular-nums text-[color-mix(in_srgb,currentColor_60%,transparent)]'
const CHIP_ON = 'border-gold bg-gold text-turf-on'
const CHIP_OFF = 'border-hairline bg-ink-soft text-muted'

const TEAM_OPTION =
  'flex cursor-pointer items-center gap-2 rounded-lg border-none bg-transparent px-2 py-[7px] text-left font-body text-[0.85rem] text-text hover:bg-paper-dim'

// Barra de filtros compartida por el Mercado y Mi equipo. `counts` pone el
// número de jugadores en cada chip; `shortPositions` usa POR/DEF/MID/DEL en
// vez de Portero/Defensa/…, que en el Mercado no caben al lado del número.
interface PlayerFiltersProps {
  teams: string[]
  filters: Filters
  onChange: (filters: Filters) => void
  sortKey: SortKey
  onSortChange: (sortKey: SortKey) => void
  sortKeys: SortKey[]
  counts?: FilterCounts
  shortPositions?: boolean
  children?: ReactNode
}

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
}: PlayerFiltersProps) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value })
  // Los grupos multi-selección son los tres que guardan array.
  type ListKey = 'positions' | 'teams' | 'statuses' | 'difficulties'
  const toggle = (key: ListKey, value: string) =>
    onChange({
      ...filters,
      [key]: (filters[key] as string[]).includes(value)
        ? (filters[key] as string[]).filter((v) => v !== value)
        : [...(filters[key] as string[]), value],
    })

  const active = countActive(filters)

  return (
    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
      <fieldset className="flex flex-wrap gap-1.5 border-0 p-0 [min-inline-size:0]">
        <legend className="sr-only">Filtrar por posición</legend>
        <button
          type="button"
          className={`chip ${filters.positions.length === 0 ? CHIP_ON : CHIP_OFF}`}
          aria-pressed={filters.positions.length === 0}
          onClick={() => set('positions', [])}
        >
          Todos {counts && <span className={CHIP_COUNT}>{counts.total}</span>}
        </button>
        {POSITIONS.map((p) => (
          <label key={p} className={`chip ${filters.positions.includes(p) ? CHIP_ON : CHIP_OFF}`}>
            <input
              type="checkbox"
              className="sr-only"
              checked={filters.positions.includes(p)}
              onChange={() => toggle('positions', p)}
            />
            <span className="size-1.5 shrink-0 rounded-sm" style={{ background: `var(--pos-${p.toLowerCase()})` }} />
            {shortPositions ? p : POSITION_LABEL[p]}
            {counts && <span className={CHIP_COUNT}>{counts[p] ?? 0}</span>}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-wrap gap-1.5 border-0 p-0 [min-inline-size:0]">
        <legend className="sr-only">Filtrar por estado</legend>
        {STATUS_FILTERS.map((status) => (
          <label
            key={status.id}
            className={`chip ${filters.statuses.includes(status.id) ? CHIP_ON : CHIP_OFF}`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={filters.statuses.includes(status.id)}
              onChange={() => toggle('statuses', status.id)}
            />
            <span className="inline-flex shrink-0" style={{ color: status.color }}>
              <StatusIcon id={status.id} />
            </span>
            {status.label}
            {counts && <span className={CHIP_COUNT}>{counts[status.id] ?? 0}</span>}
          </label>
        ))}
      </fieldset>

      {children}

      <div className="flex flex-wrap gap-2">
        <TeamSelect teams={teams} value={filters.teams} onChange={(value) => set('teams', value)} />

        <select className="rounded-[11px] border border-hairline bg-[color-mix(in_srgb,var(--ink)_70%,transparent)] px-2.5 py-2 font-body text-[0.85rem] text-text" value={sortKey} onChange={(e) => onSortChange(e.target.value)}>
          {sortKeys.map((key) => (
            <option key={key} value={key}>
              Ordenar: {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <details className="group basis-full">
        <summary className="inline-flex w-fit cursor-pointer list-none select-none items-center gap-1.5 rounded-full border border-hairline bg-ink-soft px-3 py-1.5 text-[0.81rem] font-semibold text-muted group-open:bg-paper-dim group-open:text-text [&::-webkit-details-marker]:hidden">
          Más filtros
          {active > 0 && <span className={CHIP_COUNT}>{active}</span>}
        </summary>

        <div className="mt-3 mb-2.5 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3.5 rounded-xl border border-hairline bg-[color-mix(in_srgb,var(--ink)_40%,transparent)] p-3.5">
          <CheckGroup
            legend="Calendario (próx. 3 partidos)"
            options={DIFFICULTY_BANDS}
            selected={filters.difficulties}
            onToggle={(id) => toggle('difficulties', id)}
          />

          <fieldset className={FILTER_GROUP}>
            <legend className={FILTER_LEGEND}>Precio (M€)</legend>
            <div className="flex flex-wrap gap-2">
              <NumberFilter label="Desde" value={filters.minPrice} step="0.5" onChange={(v) => set('minPrice', v)} />
              <NumberFilter label="Hasta" value={filters.maxPrice} step="0.5" onChange={(v) => set('maxPrice', v)} />
            </div>
          </fieldset>

          <fieldset className={FILTER_GROUP}>
            <legend className={FILTER_LEGEND}>Rendimiento mínimo</legend>
            <div className="flex flex-wrap gap-2">
              <NumberFilter label="Puntos" value={filters.minPoints} step="1" onChange={(v) => set('minPoints', v)} />
              <NumberFilter label="Media" value={filters.minAverage} step="0.5" onChange={(v) => set('minAverage', v)} />
              <NumberFilter label="Forma" value={filters.minForm} step="1" onChange={(v) => set('minForm', v)} />
            </div>
          </fieldset>
        </div>

        <button type="button" className="btn btn-ghost" disabled={active === 0} onClick={() => onChange(EMPTY_FILTERS)}>
          Limpiar filtros
        </button>
      </details>
    </div>
  )
}

function CheckGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string
  options: readonly { id: string; label: string }[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <fieldset className={FILTER_GROUP}>
      <legend className={FILTER_LEGEND}>{legend}</legend>
      <div className="flex flex-col gap-[5px]">
        {options.map((option) => (
          <label key={option.id} className="flex cursor-pointer items-center gap-[7px] text-[0.84rem] text-text">
            <input
              type="checkbox"
              className="size-[15px] cursor-pointer accent-[var(--turf)]"
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

function NumberFilter({
  label,
  value,
  step,
  onChange,
}: {
  label: string
  value: string
  step: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-1 basis-[78px] flex-col gap-1 text-[0.76rem] text-muted">
      <span>{label}</span>
      <input
        type="number"
        className="w-full rounded-[9px] border border-hairline bg-[color-mix(in_srgb,var(--ink)_70%,transparent)] px-2 py-[7px] font-body text-[0.85rem] tabular-nums text-text"
        inputMode="decimal"
        min="0"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

export function TeamSelect({
  teams,
  value,
  onChange,
}: {
  teams: string[]
  value: string[]
  onChange: (teams: string[]) => void
}) {
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) ref.current.open = false
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function toggle(team: string) {
    onChange(value.includes(team) ? value.filter((t) => t !== team) : [...value, team])
  }

  const label =
    value.length === 0 ? 'Todos los equipos' : value.length === 1 ? value[0] : `${value.length} equipos`

  return (
    <details className="group relative" ref={ref}>
      <summary className="flex cursor-pointer list-none select-none items-center gap-[7px] rounded-[11px] border border-hairline bg-[color-mix(in_srgb,var(--ink)_70%,transparent)] px-2.5 py-2 font-body text-[0.85rem] text-text [&::-webkit-details-marker]:hidden">
        {value.length === 1 && <TeamCrest team={value[0]} size={16} />}
        <span>{label}</span>
        <svg
          className="ml-0.5 text-muted transition-transform duration-200 group-open:rotate-180"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <fieldset className="absolute top-[calc(100%+6px)] left-0 z-10 flex max-h-[280px] min-w-[210px] animate-[dropdown-pop_var(--duration-fast)_var(--ease-smooth-out)] flex-col gap-0.5 overflow-y-auto rounded-xl border border-hairline bg-paper-solid p-1.5 shadow-float [min-inline-size:0]">
        <legend className="sr-only">Equipos</legend>
        <button
          type="button"
          className={`${TEAM_OPTION} disabled:cursor-default disabled:opacity-50`}
          disabled={value.length === 0}
          onClick={() => onChange([])}
        >
          Todos los equipos
        </button>
        {teams.map((t) => (
          <label
            key={t}
            className={`${TEAM_OPTION} ${
              value.includes(t) ? 'bg-[color-mix(in_srgb,var(--turf)_14%,transparent)] font-semibold text-turf' : ''
            }`}
          >
            <input
              type="checkbox"
              className="size-[15px] cursor-pointer accent-[var(--turf)]"
              checked={value.includes(t)}
              onChange={() => toggle(t)}
            />
            <TeamCrest team={t} size={16} />
            {t}
          </label>
        ))}
      </fieldset>
    </details>
  )
}
