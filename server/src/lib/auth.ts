import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'

function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production.')
  }

  return 'dev-secret-change-in-production'
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'access' }, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  })
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, getJwtSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  })
}

export function verifyToken(token: string): {
  sub: string
  type: string
} | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { sub: string; type: string }
  } catch {
    return null
  }
}
