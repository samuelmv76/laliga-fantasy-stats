import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { PLAYER_STATUS, POSITION_LABEL } from '../data/mockPlayers.tsx'
import { chartDay, chartEuros, formatDay, formatEurosCompact, formatMatchDateTime } from '../utils/format.tsx'
import { oddsLabel, winChance } from '../utils/opponent.tsx'
import { form, matchesPlayed, pointsAverage } from '../utils/playerStats.tsx'
import type { FixturesByTeam, MatchdayPoints, Player } from '../types.tsx'
import { DifficultyBars, StatusBadge } from './PlayerRow.tsx'
import TeamCrest from './TeamCrest.tsx'
import { StatCards } from './spectrumui/charts/stat-cards.jsx'

// Lo que dura la animación de cierre (--duration-quick en App.css).
const CLOSE_MS = 150

const SECTION_TITLE = 'mt-[18px] mb-1 font-display text-[0.9rem] font-medium text-muted'

const STATUS_BANNER = {
  warn: 'bg-[color-mix(in_srgb,#ffd60a_14%,transparent)] text-[color-mix(in_srgb,#ffd60a_80%,var(--text))]',
  danger: 'bg-[color-mix(in_srgb,var(--fall)_14%,transparent)] text-[color-mix(in_srgb,var(--fall)_82%,var(--text))]',
}

// Convierte los puntos de cada jornada (pueden ser negativos) en un total
// acumulado ascendente, para que la gráfica se lea como progreso de
// temporada en vez de como un vaivén de barras.
function cumulativeByMatchday(pointsByMatchday: MatchdayPoints[]) {
  let total = 0
  return pointsByMatchday.map((d) => {
    total += d.points
    return { matchday: d.matchday, points: d.points, total }
  })
}

// Estadísticas reales de la temporada (scrape_stats.py). Se muestran solo
// las que hay: con los datos de prueba no existe `stats`, y un jugador de
// campo no tiene paradas.
function seasonStats(player: Player) {
  const played = matchesPlayed(player)
  const { minutes, goals, assists, yellow, red, saves, conceded } = player.stats ?? {}
  const isKeeper = player.pos === 'POR'
  const cards = (yellow ?? 0) + (red ?? 0)

  const filas: { label: string; value: string | number | null }[] = [
    { label: 'Partidos', value: played || null },
    { label: 'Media', value: played > 0 ? pointsAverage(player).toFixed(1).replace('.', ',') : null },
    { label: 'Forma (3 J)', value: player.pointsByMatchday?.length ? form(player) : null },
    { label: 'Minutos', value: minutes ?? null },
    { label: 'Goles', value: goals ?? null },
    { label: 'Asistencias', value: assists ?? null },
    { label: 'Paradas', value: isKeeper ? saves ?? null : null },
    { label: 'Goles encajados', value: isKeeper ? conceded ?? null : null },
    { label: 'Tarjetas', value: yellow === undefined ? null : cards },
  ]
  return filas.filter((stat) => stat.value !== null && stat.value !== undefined)
}

function MatchdayDot({ cx, cy, payload }: { cx?: number; cy?: number; payload?: { points: number } }) {
  if (cx == null || cy == null) return null
  const points = payload?.points ?? 0
  const color = points > 0 ? 'var(--rise)' : points < 0 ? 'var(--fall)' : 'var(--text-muted)'
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="var(--paper)" strokeWidth={1.5} />
}

interface PlayerDetailProps {
  player: Player | null
  fixtures?: FixturesByTeam
  inSquad: boolean
  onAdd: (player: Player) => void
  onRemove: (id: string) => void
  onClose: () => void
}

export default function PlayerDetail({
  player,
  fixtures,
  inSquad,
  onAdd,
  onRemove,
  onClose,
}: PlayerDetailProps) {
  const [rendered, setRendered] = useState<Player | null>(player)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (player) {
      setRendered(player)
      setClosing(false)
    } else if (rendered) {
      setClosing(true)
    }
  }, [player])

  // El desmontaje va por tiempo y no por onAnimationEnd: ese evento no llega
  // si la animación no corre (prefers-reduced-motion la desactiva, y una
  // pestaña en segundo plano ni la arranca) y la ficha se quedaba abierta.
  useEffect(() => {
    if (!closing) return undefined
    const timer = setTimeout(() => setRendered(null), CLOSE_MS)
    return () => clearTimeout(timer)
  }, [closing])

  // Con la ficha abierta, la página de detrás no se mueve: si no, la rueda
  // del ratón sobre el modal scrollea la lista y la cabecera pegajosa se
  // pasea por encima. Se cierra con Escape, como cualquier diálogo.
  useEffect(() => {
    if (!player) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [player, onClose])

  if (!rendered) return null

  const cumulativePoints = rendered.pointsByMatchday?.length
    ? cumulativeByMatchday(rendered.pointsByMatchday)
    : null
  const teamFixtures = fixtures?.[rendered.team]
  const realStats = seasonStats(rendered)

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-5 backdrop-blur-[20px] ${
        closing
          ? 'animate-[modal-fade-out_var(--duration-quick)_var(--ease-smooth-out)_forwards]'
          : 'animate-[modal-fade_var(--duration-fast)_var(--ease-smooth-out)]'
      } motion-reduce:animate-none`}
      onClick={onClose}
    >
      <div
        className={`card relative max-h-[90vh] w-full max-w-[460px] overflow-y-auto p-6 md:max-w-[620px] md:px-8 md:py-7 ${
          closing
            ? 'animate-[modal-pop-out_var(--duration-quick)_var(--ease-smooth-out)_forwards]'
            : 'animate-[modal-pop_var(--duration-fast)_var(--ease-smooth-out)]'
        } motion-reduce:animate-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 cursor-pointer border-none bg-none text-[1.4rem] leading-none text-muted"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>

        <p className="mb-2.5 flex items-center gap-1.5 font-display text-[0.73rem] font-semibold uppercase tracking-[0.09em] text-turf">
          <TeamCrest team={rendered.team} size={16} />
          {rendered.team} · {POSITION_LABEL[rendered.pos]}
        </p>
        <h2 className="m-0 mb-3.5 font-display text-2xl">
          <span className="flex min-w-0 items-center gap-[7px]">
            {rendered.name}
            <StatusBadge status={rendered.status} note={rendered.statusNote} until={rendered.statusUntil} />
          </span>
        </h2>

        {rendered.status && (
          <p
            className={`mb-3.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 rounded-[10px] px-3 py-[9px] text-[0.84rem] font-semibold ${
              STATUS_BANNER[PLAYER_STATUS[rendered.status].tone]
            }`}
          >
            {[rendered.statusNote, rendered.statusUntil].filter(Boolean).join(' · ')}
            {rendered.playProbability != null && (
              <span className="font-medium opacity-80">
                {rendered.playProbability}% de jugar el próximo partido
              </span>
            )}
          </p>
        )}

        <StatCards
          className="mb-3.5"
          columns={2}
          cards={[
            {
              label: 'Precio actual',
              series: rendered.priceHistory?.map((d) => d.price),
              format: formatEurosCompact,
              deltaLabel: 'vs inicio',
            },
            {
              label: 'Puntos',
              // Un jugador recién subido puede no tener ni histórico diario ni
              // desglose por jornada: la tarjeta se queda sin serie, no rota.
              series:
                rendered.pointsHistory?.map((d) => d.points) ??
                rendered.pointsByMatchday?.map((d) => d.points) ??
                [],
              value: rendered.points,
              format: (v) => `${Math.round(v)}`,
              deltaLabel: 'vs inicio',
            },
          ]}
        />

        {realStats.length > 0 && (
          <ul className="m-0 mb-3.5 flex list-none flex-wrap gap-x-[22px] gap-y-2.5 p-0">
            {realStats.map(({ label, value }) => (
              <li key={label} className="flex flex-col gap-0.5">
                <span className="font-display text-[1.15rem] tabular-nums">{value}</span>
                <span className="text-[0.72rem] uppercase tracking-[0.03em] text-muted">{label}</span>
              </li>
            ))}
          </ul>
        )}

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={rendered.priceHistory} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--paper-dim)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDay} fontSize={11} stroke="var(--text-muted)" />
            <YAxis width={44} fontSize={11} stroke="var(--text-muted)" tickFormatter={formatEurosCompact} domain={['dataMin - 300000', 'dataMax + 300000']} />
            <Tooltip
              formatter={(v) => [chartEuros(v), 'Precio']}
              labelFormatter={chartDay}
              contentStyle={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', borderRadius: 6 }}
            />
            <Line type="monotone" dataKey="price" stroke="var(--turf)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>

        {cumulativePoints && (
          <>
            <h3 className={SECTION_TITLE}>Puntos por jornada</h3>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={cumulativePoints} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="pointsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--turf)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--turf)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--paper-dim)" vertical={false} />
                <XAxis dataKey="matchday" tickFormatter={(v) => `J${v}`} fontSize={11} stroke="var(--text-muted)" />
                <YAxis width={30} fontSize={11} stroke="var(--text-muted)" />
                <Tooltip
                  formatter={(v, _name, props) => [
                    `${v} pts (${props.payload.points >= 0 ? '+' : ''}${props.payload.points} esta jornada)`,
                    'Puntos totales',
                  ]}
                  labelFormatter={(v) => `Jornada ${v}`}
                  contentStyle={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', borderRadius: 6 }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--turf)"
                  strokeWidth={2}
                  fill="url(#pointsFill)"
                  dot={<MatchdayDot />}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}

        {!rendered.pointsByMatchday && rendered.pointsHistory && rendered.pointsHistory.length > 1 && (
          <>
            <h3 className={SECTION_TITLE}>Evolución de puntos</h3>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={rendered.pointsHistory} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--paper-dim)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDay} fontSize={11} stroke="var(--text-muted)" />
                <YAxis width={30} fontSize={11} stroke="var(--text-muted)" />
                <Tooltip
                  formatter={(v) => [v, 'Puntos totales']}
                  labelFormatter={chartDay}
                  contentStyle={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', borderRadius: 6 }}
                />
                <Line type="monotone" dataKey="points" stroke="var(--turf)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}

        {teamFixtures && teamFixtures.length > 0 && (
          <>
            <h3 className={SECTION_TITLE}>Próximos partidos</h3>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {teamFixtures.map((f) => (
                <li
                  key={f.matchday}
                  className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[10px] bg-ink-soft px-2.5 py-2 text-[0.86rem]"
                >
                  <span className="w-7 shrink-0 font-display text-muted">J{f.matchday}</span>
                  <span className="flex min-w-0 flex-1 basis-[128px] items-center gap-1.5">
                    <TeamCrest team={f.opponent} size={16} />
                    <span className="truncate">{f.home ? `vs ${f.opponent}` : `en ${f.opponent}`}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <DifficultyBars fixture={f} />
                    <span className="whitespace-nowrap text-[0.72rem] font-semibold tabular-nums" title={oddsLabel(f)}>
                      {winChance(f)}%
                    </span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-muted">{formatMatchDateTime(f.kickoff)}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {inSquad ? (
          <button className="btn btn-remove" onClick={() => onRemove(rendered.id)}>
            Quitar de mi equipo
          </button>
        ) : (
          <button className="btn btn-add" onClick={() => onAdd(rendered)}>
            Seguir en mi equipo
          </button>
        )}
      </div>
    </div>
  )
}
