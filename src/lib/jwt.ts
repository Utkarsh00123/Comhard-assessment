import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_fallback_key_2026'

export interface JWTPayload {
  userId: string
  email: string
}

export function signJwt(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyJwt(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (err) {
    return null
  }
}

export function getAuthUserFromRequest(request: Request): JWTPayload | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7).trim()
  if (!token) {
    return null
  }

  return verifyJwt(token)
}
