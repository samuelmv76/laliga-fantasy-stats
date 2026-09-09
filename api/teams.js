import { neon } from '@neondatabase/serverless'
import { getClerkUserId, clerkClient } from './_lib/auth.js'

const sql = neon(process.env.DATABASE_URL)
const MAX_SQUAD = 25

// La columna `google_id` de la tabla `users` guarda el id de Clerk
// (user_xxx), no un id de Google literal: Clerk ya gestiona qué proveedor
// usó cada usuario (Google o email), y aquí solo necesitamos una clave
// externa estable por usuario.
async function ensureUserAndTeam(clerkUserId) {
  const existing = await sql`SELECT id FROM users WHERE google_id = ${clerkUserId}`

  let userId
  if (existing.length > 0) {
    userId = existing[0].id
  } else {
    const user = await clerkClient.users.getUser(clerkUserId)
    const email =
      user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? null
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || null
    const avatarUrl = user.imageUrl ?? null

    const inserted = await sql`
      INSERT INTO users (google_id, email, name, avatar_url)
      VALUES (${clerkUserId}, ${email}, ${name}, ${avatarUrl})
      ON CONFLICT (google_id) DO UPDATE SET email = EXCLUDED.email
      RETURNING id
    `
    userId = inserted[0].id
  }

  const existingTeam = await sql`SELECT id FROM teams WHERE user_id = ${userId}`
  if (existingTeam.length > 0) {
    return existingTeam[0].id
  }

  const insertedTeam = await sql`INSERT INTO teams (user_id) VALUES (${userId}) RETURNING id`
  return insertedTeam[0].id
}

async function getSquadIds(teamId) {
  const rows = await sql`
    SELECT player_id FROM team_players WHERE team_id = ${teamId} ORDER BY added_at ASC
  `
  return rows.map((r) => r.player_id)
}

export default async function handler(req, res) {
  const clerkUserId = await getClerkUserId(req)
  if (!clerkUserId) {
    res.status(401).json({ error: 'no-autenticado' })
    return
  }

  let teamId
  try {
    teamId = await ensureUserAndTeam(clerkUserId)
  } catch (error) {
    console.error('Error creando/leyendo usuario o equipo:', error)
    res.status(500).json({ error: 'error-servidor' })
    return
  }

  try {
    if (req.method === 'GET') {
      res.status(200).json({ squadIds: await getSquadIds(teamId) })
      return
    }

    if (req.method === 'POST') {
      const { action, playerId } = req.body || {}

      if (action === 'add') {
        if (!playerId) {
          res.status(400).json({ error: 'falta-playerId' })
          return
        }
        const [{ n }] = await sql`
          SELECT COUNT(*)::int AS n FROM team_players WHERE team_id = ${teamId}
        `
        if (n >= MAX_SQUAD) {
          res.status(400).json({ error: 'equipo-completo' })
          return
        }
        await sql`
          INSERT INTO team_players (team_id, player_id)
          VALUES (${teamId}, ${playerId})
          ON CONFLICT (team_id, player_id) DO NOTHING
        `
      } else if (action === 'remove') {
        if (!playerId) {
          res.status(400).json({ error: 'falta-playerId' })
          return
        }
        await sql`DELETE FROM team_players WHERE team_id = ${teamId} AND player_id = ${playerId}`
      } else if (action === 'clear') {
        await sql`DELETE FROM team_players WHERE team_id = ${teamId}`
      } else {
        res.status(400).json({ error: 'accion-no-soportada' })
        return
      }

      res.status(200).json({ squadIds: await getSquadIds(teamId) })
      return
    }

    res.status(405).json({ error: 'metodo-no-soportado' })
  } catch (error) {
    console.error('Error en /api/teams:', error)
    res.status(500).json({ error: 'error-servidor' })
  }
}
