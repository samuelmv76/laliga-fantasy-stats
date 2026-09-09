import { createClerkClient, verifyToken } from '@clerk/backend'

const secretKey = process.env.CLERK_SECRET_KEY

export const clerkClient = createClerkClient({ secretKey })

// Verifica el token (Bearer) que manda el frontend con getToken() de Clerk.
// Devuelve el id de usuario de Clerk (payload.sub) o null si no es válido.
export async function getClerkUserId(req) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  try {
    const payload = await verifyToken(token, { secretKey })
    return payload.sub
  } catch {
    return null
  }
}
