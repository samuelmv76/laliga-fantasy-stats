// Formas de datos que devuelven /api/players y /api/fixtures, que son las
// mismas que publica el scraper en scraper/data/*.json.
//
// Casi todo es opcional a propósito: son datos externos. El histórico de
// puntos por jornada no existe hasta que corre scrape_matchday_points.py, un
// jugador recién ascendido no tiene `stats`, y un jugador sano no trae
// `status`. El front tiene que aguantar todo eso sin romperse.

export type Position = 'POR' | 'DEF' | 'MID' | 'DEL'

/** Estado deportivo. Un jugador disponible no trae `status` en absoluto. */
export type PlayerStatus = 'duda' | 'lesion' | 'sancion'

export interface PricePoint {
  date: string
  price: number
}

export interface PointsPoint {
  date: string
  points: number
}

export interface MatchdayPoints {
  matchday: number
  points: number
}

/** Acumulado de temporada de /analytics/<equipo>/estadisticas. */
export interface PlayerStats {
  minutes?: number
  goals?: number
  assists?: number
  yellow?: number
  red?: number
  saves?: number
  conceded?: number
}

export interface Player {
  id: string
  name: string
  team: string
  pos: Position
  points: number
  priceHistory: PricePoint[]
  pointsHistory?: PointsPoint[]
  pointsByMatchday?: MatchdayPoints[]
  /** Partidos jugados en la temporada y en las últimas 5 jornadas. */
  played?: number
  played5?: number
  status?: PlayerStatus
  /** Qué le pasa: "Rotura de lig. cruzado anterior". */
  statusNote?: string
  /** Cuánto dura: "Baja hasta abril". Las sanciones no lo publican. */
  statusUntil?: string
  /** % de que juegue el próximo partido, 0-100. */
  playProbability?: number
  stats?: PlayerStats
}

/** Cuotas 1X2 decimales europeas, con el margen de la casa incluido. */
export interface Odds {
  home: number
  draw: number
  away: number
}

export interface Fixture {
  matchday: number
  opponent: string
  home: boolean
  kickoff: string
  odds?: Odds
  /** Alternativas cuando no hay cuotas (datos de prueba). */
  difficulty?: number
  winChance?: number
}

/** Calendario por equipo, tal y como lo sirve /api/fixtures. */
export type FixturesByTeam = Record<string, Fixture[]>

/** Si se puede añadir un jugador al equipo, y por qué no. */
export type AddCheck =
  | { ok: true }
  | { ok: false; reason: 'no-autenticado' | 'ya-en-equipo' | 'equipo-completo' | 'error-servidor' }
