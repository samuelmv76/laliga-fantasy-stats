// Constructores para los tests: un jugador y un partido completos a los que
// cada prueba cambia solo lo que le importa. Así las pruebas no repiten los
// campos obligatorios ni se saltan el tipo.
import type { Fixture, Player } from '../types.tsx'

export function jugador(extra: Partial<Player> & { id: string }): Player {
  return {
    name: `Jugador ${extra.id}`,
    team: 'Celta',
    pos: 'DEL',
    points: 10,
    played: 5,
    priceHistory: [
      { date: '2026-09-01', price: 8_000_000 },
      { date: '2026-09-02', price: 10_000_000 },
    ],
    pointsByMatchday: [
      { matchday: 1, points: 2 },
      { matchday: 2, points: 2 },
      { matchday: 3, points: 2 },
    ],
    ...extra,
  }
}

export function partido(extra: Partial<Fixture> = {}): Fixture {
  return {
    matchday: 7,
    opponent: 'Rival',
    home: true,
    kickoff: '2026-09-20T21:00:00+02:00',
    ...extra,
  }
}
