import { FORMATION } from '../hooks/useSquad'
import { POSITIONS } from '../data/mockPlayers'

// Orden de líneas de arriba (delanteros) a abajo (portero), como se ve un campo en vertical
const LINES = ['DEL', 'MID', 'DEF', 'POR']
const LINE_Y = { DEL: 14, MID: 40, DEF: 66, POR: 90 }

function slotsForLine(line, squad) {
  const players = squad.filter((p) => p.pos === line)
  const total = FORMATION[line]
  const slots = []
  for (let i = 0; i < total; i++) slots.push(players[i] ?? null)
  return slots
}

export default function Pitch({ squad, removePlayer }) {
  return (
    <div className="pitch">
      <svg className="pitch__field" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <rect x="0" y="0" width="100" height="100" fill="var(--turf)" />
        {[16.6, 33.3, 50, 66.6, 83.3].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--turf-line)" strokeWidth="0.4" />
        ))}
        <circle cx="50" cy="50" r="9" fill="none" stroke="var(--turf-line)" strokeWidth="0.4" />
        <rect x="20" y="0" width="60" height="12" fill="none" stroke="var(--turf-line)" strokeWidth="0.4" />
        <rect x="20" y="88" width="60" height="12" fill="none" stroke="var(--turf-line)" strokeWidth="0.4" />
      </svg>

      {LINES.map((line) => {
        const slots = slotsForLine(line, squad)
        return (
          <div className="pitch__line" style={{ top: `${LINE_Y[line]}%` }} key={line}>
            {slots.map((player, i) =>
              player ? (
                <button
                  key={player.id}
                  className="pitch__player"
                  onClick={() => removePlayer(player.id)}
                  title={`Quitar a ${player.name}`}
                >
                  <span className="pitch__player-price">{player.price.toFixed(1)}M</span>
                  <span className="pitch__player-name">{player.name}</span>
                </button>
              ) : (
                <span className="pitch__slot" key={`${line}-${i}`}>
                  {line}
                </span>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}
