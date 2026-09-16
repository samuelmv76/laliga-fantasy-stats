import { readFileSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// En desarrollo no hay funciones de Vercel, así que /api/* no existe y el
// front cae a los datos de prueba de mockPlayers.js. Esto sirve en su lugar
// los ficheros canónicos del scraper, que tienen exactamente la misma forma
// que devuelven /api/players y /api/fixtures en producción: así se ve la app
// con los 656 jugadores reales sin desplegar. Solo afecta a `vite dev`.
function scraperDataApi() {
  const read = (name) =>
    JSON.parse(readFileSync(path.resolve(import.meta.dirname, `./scraper/data/${name}`), 'utf-8'))

  return {
    name: 'scraper-data-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const send = (data) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        }
        try {
          if (req.url.startsWith('/api/players')) return send(read('jugadores.json'))
          if (req.url.startsWith('/api/fixtures')) {
            // Mismo criterio que la consulta real: solo partidos por jugar.
            const now = Date.now()
            const byTeam = {}
            for (const [team, list] of Object.entries(read('calendario.json'))) {
              const upcoming = list.filter((f) => Date.parse(f.kickoff) > now)
              if (upcoming.length > 0) byTeam[team] = upcoming
            }
            return send(byTeam)
          }
        } catch (error) {
          console.warn('[scraper-data-api] no se pudo leer el dato del scraper:', error.message)
        }
        return next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), scraperDataApi()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
