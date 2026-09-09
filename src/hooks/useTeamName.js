import { useEffect, useState } from 'react'
import { TEAM_NAME } from '../config'

export function useTeamName() {
  const [teamName, setTeamName] = useState(() => localStorage.getItem('teamName') || TEAM_NAME)

  useEffect(() => {
    localStorage.setItem('teamName', teamName)
  }, [teamName])

  return { teamName, setTeamName }
}
