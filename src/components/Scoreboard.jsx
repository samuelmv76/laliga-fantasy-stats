import { BUDGET } from '../hooks/useSquad'

export default function Scoreboard({ spent, remaining, squadLength, onClear }) {
  const pct = Math.min(100, (spent / BUDGET) * 100)
  const over = remaining < 0

  return (
    <div className="scoreboard">
      <div className="scoreboard__row">
        <div className="scoreboard__block">
          <span className="scoreboard__label">Plantilla</span>
          <span className="scoreboard__value">{squadLength}/11</span>
        </div>
        <div className="scoreboard__block">
          <span className="scoreboard__label">Gastado</span>
          <span className="scoreboard__value">{spent.toFixed(1)}M</span>
        </div>
        <div className="scoreboard__block">
          <span className="scoreboard__label">Disponible</span>
          <span className={`scoreboard__value${over ? ' is-fall' : ''}`}>{remaining.toFixed(1)}M</span>
        </div>
        <button className="btn btn--ghost" onClick={onClear}>
          Vaciar
        </button>
      </div>
      <div className="scoreboard__bar">
        <div className={`scoreboard__bar-fill${over ? ' is-fall' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
