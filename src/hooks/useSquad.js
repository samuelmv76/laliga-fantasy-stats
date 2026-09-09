import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '@clerk/react'
import { currentPrice } from '../data/mockPlayers'

export const MAX_SQUAD = 25

async function callTeamsApi(getToken, options = {}) {
  const token = await getToken()
  const res = await fetch('/api/teams', {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, reason: data.error ?? 'error-servidor' }
  }
  return { ok: true, squadIds: data.squadIds ?? [] }
}

export function useSquad(players) {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const [squadIds, setSquadIds] = useState([])
  const [loading, setLoading] = useState(true)

  // Carga el equipo desde /api/teams en cuanto sabemos si hay sesión.
  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      setSquadIds([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    callTeamsApi(getToken).then((result) => {
      if (cancelled) return
      if (result.ok) setSquadIds(result.squadIds)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, getToken])

  const squad = useMemo(
    () => squadIds.map((id) => players.find((p) => p.id === id)).filter(Boolean),
    [squadIds, players]
  )

  const totalValue = useMemo(
    () => squad.reduce((sum, p) => sum + currentPrice(p), 0),
    [squad]
  )

  const isFull = squadIds.length >= MAX_SQUAD

  const canAdd = useCallback(
    (player) => {
      if (!isSignedIn) return { ok: false, reason: 'no-autenticado' }
      if (squadIds.includes(player.id)) return { ok: false, reason: 'ya-en-equipo' }
      if (isFull) return { ok: false, reason: 'equipo-completo' }
      return { ok: true }
    },
    [squadIds, isFull, isSignedIn]
  )

  const addPlayer = useCallback(
    async (player) => {
      const check = canAdd(player)
      if (!check.ok) return check

      setSquadIds((ids) => [...ids, player.id]) // optimista
      const result = await callTeamsApi(getToken, { method: 'POST', body: { action: 'add', playerId: player.id } })
      if (!result.ok) {
        setSquadIds((ids) => ids.filter((x) => x !== player.id)) // revertir
        return result
      }
      setSquadIds(result.squadIds)
      return { ok: true }
    },
    [canAdd, getToken]
  )

  const removePlayer = useCallback(
    (id) => {
      const previous = squadIds
      setSquadIds((ids) => ids.filter((x) => x !== id)) // optimista
      callTeamsApi(getToken, { method: 'POST', body: { action: 'remove', playerId: id } }).then((result) => {
        if (result.ok) setSquadIds(result.squadIds)
        else setSquadIds(previous) // revertir si falla
      })
    },
    [getToken, squadIds]
  )

  return {
    squad,
    squadIds,
    totalValue,
    isFull,
    canAdd,
    addPlayer,
    removePlayer,
    loading,
  }
}
