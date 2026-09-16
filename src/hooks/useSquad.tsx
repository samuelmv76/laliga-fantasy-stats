import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '@clerk/react'
import { currentPrice } from '../data/mockPlayers.tsx'
import type { AddCheck, Player } from '../types.tsx'

export const MAX_SQUAD = 25

type TeamsApiResult =
  | { ok: true; squadIds: string[]; teamName?: string }
  | { ok: false; reason: string }

type GetToken = () => Promise<string | null>

interface TeamsApiOptions {
  method?: 'GET' | 'POST'
  body?: { action: 'add' | 'remove' | 'rename'; playerId?: string; name?: string }
}

async function callTeamsApi(getToken: GetToken, options: TeamsApiOptions = {}): Promise<TeamsApiResult> {
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
  return { ok: true, squadIds: data.squadIds ?? [], teamName: data.teamName }
}

export function useSquad(players: Player[]) {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const [squadIds, setSquadIds] = useState<string[]>([])
  const [teamName, setTeamName] = useState('Mi equipo')
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
      if (result.ok) {
        setSquadIds(result.squadIds)
        if (result.teamName) setTeamName(result.teamName)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, getToken])

  const squad = useMemo(
    () =>
      squadIds
        .map((id) => players.find((p) => p.id === id))
        .filter((p): p is Player => p !== undefined),
    [squadIds, players]
  )

  const totalValue = useMemo(
    () => squad.reduce((sum, p) => sum + currentPrice(p), 0),
    [squad]
  )

  const isFull = squadIds.length >= MAX_SQUAD

  const canAdd = useCallback(
    (player: Player): AddCheck => {
      if (!isSignedIn) return { ok: false, reason: 'no-autenticado' }
      if (squadIds.includes(player.id)) return { ok: false, reason: 'ya-en-equipo' }
      if (isFull) return { ok: false, reason: 'equipo-completo' }
      return { ok: true }
    },
    [squadIds, isFull, isSignedIn]
  )

  const addPlayer = useCallback(
    async (player: Player) => {
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
    (id: string) => {
      const previous = squadIds
      setSquadIds((ids) => ids.filter((x) => x !== id)) // optimista
      callTeamsApi(getToken, { method: 'POST', body: { action: 'remove', playerId: id } }).then((result) => {
        if (result.ok) setSquadIds(result.squadIds)
        else setSquadIds(previous) // revertir si falla
      })
    },
    [getToken, squadIds]
  )

  const renameTeam = useCallback(
    (name: string) => {
      const previous = teamName
      setTeamName(name) // optimista
      callTeamsApi(getToken, { method: 'POST', body: { action: 'rename', name } }).then((result) => {
        if (result.ok) setTeamName(result.teamName ?? name)
        else setTeamName(previous) // revertir si falla
      })
    },
    [getToken, teamName]
  )

  return {
    squad,
    squadIds,
    totalValue,
    isFull,
    canAdd,
    addPlayer,
    removePlayer,
    teamName,
    renameTeam,
    loading,
  }
}
