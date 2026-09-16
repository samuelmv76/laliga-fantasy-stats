import { useEffect, useState } from 'react'
import { PLAYERS as MOCK_PLAYERS } from '../data/mockPlayers.tsx'
import type { Player } from '../types.tsx'

// Intenta cargar los jugadores reales desde /api/players (Neon, actualizado
// cada noche por el scraper). Si la API no responde (por ejemplo en
// desarrollo local sin `vercel dev`) usa los datos de prueba para que el
// front siga siendo usable.
export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS)
  const [source, setSource] = useState<'mock' | 'real'>('mock')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetch('/api/players')
      .then((res) => {
        if (!res.ok) throw new Error('sin /api/players todavía')
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        if (Array.isArray(data) && data.length > 0) {
          setPlayers(data)
          setSource('real')
        }
      })
      .catch(() => {
        // se queda con MOCK_PLAYERS, no pasa nada
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { players, source, loading }
}
