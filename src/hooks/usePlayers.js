import { useEffect, useState } from 'react'
import { PLAYERS as MOCK_PLAYERS } from '../data/mockPlayers'

// Intenta cargar el jugadores.json real (generado por el scraper nocturno).
// Si no existe todavía o falla la carga, usa los datos de prueba para que
// el front siga siendo usable durante el desarrollo.
export function usePlayers() {
  const [players, setPlayers] = useState(MOCK_PLAYERS)
  const [source, setSource] = useState('mock')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetch('/jugadores.json')
      .then((res) => {
        if (!res.ok) throw new Error('sin jugadores.json todavía')
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
