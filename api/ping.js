import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  try {
    const result = await sql`SELECT 1 as ok`
    res.status(200).json({ connected: true, result })
  } catch (error) {
    res.status(500).json({ connected: false, error: error.message })
  }
}