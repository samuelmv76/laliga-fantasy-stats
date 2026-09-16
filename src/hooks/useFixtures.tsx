import { useEffect, useState } from 'react'
import { FIXTURES as MOCK_FIXTURES } from '../data/mockFixtures.tsx'
import type { FixturesByTeam } from '../types.tsx'

// Mismo patrón que usePlayers: intenta cargar el calendario real desde
// /api/fixtures (Neon, {equipo: [{matchday, opponent, home, kickoff}]}), y
// si la API no responde usa datos de prueba.
export function useFixtures() {
  const [fixtures, setFixtures] = useState<FixturesByTeam>(MOCK_FIXTURES)

  useEffect(() => {
    let cancelled = false

    fetch('/api/fixtures')
      .then((res) => {
        if (!res.ok) throw new Error('sin /api/fixtures todavía')
        return res.json()
      })
      .then((data) => {
        if (!cancelled && data && typeof data === 'object') setFixtures(data)
      })
      .catch(() => {
        // se queda con FIXTURES de prueba, no pasa nada
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { fixtures }
}
