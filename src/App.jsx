import { useId, useState } from 'react'
import { usePlayers } from './hooks/usePlayers'
import { useFixtures } from './hooks/useFixtures'
import { useSquad } from './hooks/useSquad'
import { useTheme } from './hooks/useTheme'
import { Show, SignInButton, UserButton } from '@clerk/react'
import Market from './components/Market'
import TeamView from './components/TeamView'
import Ranking from './components/Ranking'
import PlayerDetail from './components/PlayerDetail'
import './App.css'

export default function App() {
  const { players, source } = usePlayers()
  const { fixtures } = useFixtures()
  const { squad, squadIds, totalValue, canAdd, addPlayer, removePlayer, teamName, renameTeam } = useSquad(players)
  const { theme, toggleTheme } = useTheme()
  const TABS = [
    { id: 'mercado', label: 'Mercado' },
    { id: 'equipo', label: teamName },
    { id: 'ranking', label: 'Ranking' },
  ]
  const [tab, setTab] = useState('mercado')
  const [selected, setSelected] = useState(null)

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <AppMark size={30} />
          <span className="app__wordmark">LaLiga Fantasy</span>
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

      <div className="app__hero">
        <p className="app__eyebrow">Temporada 25/26</p>
        <h1 className="app__title">LaLiga Fantasy Stats</h1>
        <p className="app__tagline">
          {source === 'real'
            ? 'Precios y puntos de todos los jugadores, actualizados cada noche.'
            : 'Datos de prueba — se sustituirán en cuanto el scraper publique jugadores.json.'}
        </p>
      </div>

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
            onAddPlayer={() => setTab('mercado')}
            teamName={teamName}
            onRenameTeam={renameTeam}
          />
        )}
        {tab === 'ranking' && <Ranking players={players} onSelect={setSelected} />}
      </main>

      <footer className="app__footer">
        <div className="app__footer-top">
          <div className="app__footer-brand">
            <AppMark size={28} />
            <div>
              <p className="app__footer-title">LaLiga Fantasy Stats</p>
              <p className="app__footer-tagline">Seguimiento de precios y puntos, temporada 25/26.</p>
            </div>
          </div>
          <div className="app__footer-links">
            <a
              href="https://www.linkedin.com/in/samuel-martos-7953803ab/"
              target="_blank"
              rel="noopener noreferrer"
              className="app__footer-link"
              aria-label="Perfil de LinkedIn de Samuel Martos"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56z" />
              </svg>
              LinkedIn
            </a>
            <a
              href="https://github.com/samuelmv76/laliga-fantasy-stats"
              target="_blank"
              rel="noopener noreferrer"
              className="app__footer-link"
              aria-label="Repositorio del proyecto en GitHub"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.58 2 12.2c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.5 0-.24-.01-1.04-.01-1.89-2.78.61-3.37-1.2-3.37-1.2-.46-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05a9.28 9.28 0 0 1 5 0c1.9-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.81 0 .27.18.6.69.5A10.03 10.03 0 0 0 22 12.2C22 6.58 17.52 2 12 2z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
        <div className="app__footer-divider" />
        <div className="app__footer-meta">
          <p>
            {source === 'real'
              ? 'Los precios se actualizan cada noche.'
              : 'Mostrando datos de prueba — se sustituirán por los reales en cuanto el scraper publique jugadores.json.'}
          </p>
          <p className="app__footer-legal">
            Proyecto personal, no oficial ni afiliado a LaLiga. El equipo y el seguimiento se guardan en este
            navegador. © {new Date().getFullYear()} Samuel Martos
          </p>
        </div>
      </footer>

      <PlayerDetail
        player={selected}
        fixtures={fixtures}
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

function AppMark({ size = 32 }) {
  const gradientId = `mark-${useId().replace(/:/g, '')}`
  return (
    <svg className="app__mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0" stopColor="#0A9BFF" />
          <stop offset="1" stopColor="#0A45E0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14.4" fill={`url(#${gradientId})`} />
      <g fill="#fff">
        <circle cx="32" cy="23" r="10.5" />
        <rect x="19" y="43.5" width="6.5" height="7.5" rx="3.25" />
        <rect x="28.75" y="40" width="6.5" height="11" rx="3.25" />
        <rect x="38.5" y="36" width="6.5" height="15" rx="3.25" />
      </g>
      <path d="M32 16.6 38.56 21.37 36.06 29.08 27.94 29.08 25.44 21.37Z" fill={`url(#${gradientId})`} />
    </svg>
  )
}
