import { useEffect, useState, useCallback, useMemo } from 'react'
import { currentPrice } from '../data/mockPlayers'

const STORAGE_KEY = 'laliga-fantasy:equipo'
export const MAX_SQUAD = 25

function loadSquad() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useSquad(players) {
  const [squadIds, setSquadIds] = useState(loadSquad)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(squadIds))
  }, [squadIds])

  const squad = useMemo(
    () => squadIds.map((id) => players.find((p) => p.id === id)).filter(Boolean),
    [squadIds, players]
  )

  const totalValue = useMemo(
    () => +squad.reduce((sum, p) => sum + currentPrice(p), 0).toFixed(1),
    [squad]
  )

  const isFull = squad.length >= MAX_SQUAD

  const canAdd = useCallback(
    (player) => {
      if (squadIds.includes(player.id)) return { ok: false, reason: 'ya-en-equipo' }
      if (isFull) return { ok: false, reason: 'equipo-completo' }
      return { ok: true }
    },
    [squadIds, isFull]
  )

  const addPlayer = useCallback(
    (player) => {
      const check = canAdd(player)
      if (!check.ok) return check
      setSquadIds((ids) => [...ids, player.id])
      return { ok: true }
    },
    [canAdd]
  )

  const removePlayer = useCallback((id) => {
    setSquadIds((ids) => ids.filter((x) => x !== id))
  }, [])

  const clearSquad = useCallback(() => setSquadIds([]), [])

  return {
    squad,
    squadIds,
    totalValue,
    isFull,
    canAdd,
    addPlayer,
    removePlayer,
    clearSquad,
  }
}
