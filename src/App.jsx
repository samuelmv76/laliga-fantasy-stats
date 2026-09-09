import { useState } from 'react'
import { usePlayers } from './hooks/usePlayers'
import { useSquad } from './hooks/useSquad'
import { useTheme } from './hooks/useTheme'
import { Show, SignInButton, UserButton } from '@clerk/react'
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
  const { theme, toggleTheme } = useTheme()
  const [tab, setTab] = useState('mercado')
  const [selected, setSelected] = useState(null)

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <AppMark />
          <div>
            <p className="app__eyebrow">LaLiga Fantasy</p>
            <h1>LaLiga Fantasy Stats</h1>
            <p className="app__tagline">
              Temporada 25/26 · {source === 'real' ? 'datos actualizados cada noche' : 'datos de prueba'}
            </p>
          </div>
        </div>
        <div className="app__header-controls">
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
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
            aria-pressed={theme === 'dark'}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
              </svg>
            )}
          </button>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button type="button" className="btn btn--ghost">
                Iniciar sesión
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton afterSignOutUrl="/" />
          </Show>
        </div>
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
        <div className="app__footer-brand">
          <AppMark size={28} />
          <div>
            <p className="app__footer-title">LaLiga Fantasy Stats</p>
            <p className="app__footer-tagline">Seguimiento de precios y puntos, temporada 25/26.</p>
          </div>
        </div>
        <div className="app__footer-meta">
          <p>
            {source === 'real'
              ? 'Los precios se actualizan cada noche.'
              : 'Mostrando datos de prueba — se sustituirán por los reales en cuanto el scraper publique jugadores.json.'}
          </p>
          <p className="app__footer-legal">
            Proyecto personal, no oficial ni afiliado a LaLiga. El equipo y el seguimiento se guardan en este
            navegador. © {new Date().getFullYear()}
          </p>
        </div>
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

function AppMark({ size = 36 }) {
  return (
    <span className="app__mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v3.2M12 17.8V21M4.4 8.5l3.1.9M16.5 14.6l3.1.9M4.4 15.5l3.1-.9M16.5 9.4l3.1-.9M9 9l3 2 3-2-1-3.5h-4z" />
      </svg>
    </span>
  )
}
