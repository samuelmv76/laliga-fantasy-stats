import { useState } from 'react'
import { usePlayers } from './hooks/usePlayers'
import { useSquad } from './hooks/useSquad'
import Market from './components/Market'
import TeamView from './components/TeamView'
import Ranking from './components/Ranking'
import PlayerDetail from './components/PlayerDetail'
import './App.css'

const TABS = [
  { id: 'mercado', label: 'Mercado' },
  { id: 'equipo', label: 'Mi equipo' },
  { id: 'ranking', label: 'Ranking' },
]

export default function App() {
  const { players, source } = usePlayers()
  const { squad, squadIds, totalValue, canAdd, addPlayer, removePlayer, clearSquad } = useSquad(players)
  const [tab, setTab] = useState('mercado')
  const [selected, setSelected] = useState(null)

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="app__eyebrow">
            Temporada 25/26 · {source === 'real' ? 'datos actualizados' : 'datos de prueba'}
          </p>
          <h1>LaLiga Fantasy · Estadísticas</h1>
        </div>
        <nav className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`tabs__item${tab === t.id ? ' tabs__item--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === 'equipo' && squad.length > 0 && <span className="tabs__badge">{squad.length}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="app__main app__main--single">
        {tab === 'mercado' && (
          <Market
            players={players}
            squadIds={squadIds}
            canAdd={canAdd}
            addPlayer={addPlayer}
            removePlayer={removePlayer}
            onSelect={setSelected}
          />
        )}
        {tab === 'equipo' && (
          <TeamView
            squad={squad}
            totalValue={totalValue}
            removePlayer={removePlayer}
            onSelect={setSelected}
            onClear={clearSquad}
          />
        )}
        {tab === 'ranking' && <Ranking players={players} onSelect={setSelected} />}
      </main>

      <footer className="app__footer">
        El equipo y el seguimiento se guardan en este navegador.
        {source === 'real'
          ? ' Los precios se actualizan cada noche.'
          : ' Los precios de ejemplo se sustituirán por los reales en cuanto el scraper publique jugadores.json.'}
      </footer>

      <PlayerDetail
        player={selected}
        inSquad={selected ? squadIds.includes(selected.id) : false}
        onAdd={(p) => {
          addPlayer(p)
        }}
        onRemove={(id) => {
          removePlayer(id)
        }}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
