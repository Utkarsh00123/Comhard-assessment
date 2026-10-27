/**
 * ============================================================================
 * JSON WEB TOKEN (JWT) UTILITIES
 * ============================================================================
 * This module provides cryptographic helpers to generate, sign, and verify
 * authentication tokens.
 * 
 * HOW IT WORKS:
 * Instead of relying on third-party BaaS (Backend-as-a-Service) authentication,
 * the application issues stateless HMAC-SHA256 signed JSON Web Tokens.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - When a user logs in or signs up, `signJwt()` generates a token returned to the client.
 * - The client saves the token in `localStorage` and includes it as a `Bearer` token
 *   in the HTTP `Authorization` header of subsequent requests.
 * - API route handlers call `getAuthUserFromRequest()` to verify the token, validate identity,
 *   and enforce strict multi-tenant data isolation (users only access their own tasks).
 */

import jwt from 'jsonwebtoken'

// Secret key used to sign and verify JWT signatures. Defaults to a fallback in development.
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_fallback_key_2026'

/**
 * JWTPayload
 * ----------------------------------------------------------------------------
 * The minimal, non-sensitive identity claims packed into each token.
 */
export interface JWTPayload {
  userId: string
  email: string
}

/**
 * signJwt
 * ----------------------------------------------------------------------------
 * HOW IT WORKS:
 * Encodes the user's ID and email into a cryptographically signed token string
 * with a 7-day expiration time.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Sent in response payloads for `/api/auth/login` and `/api/auth/signup`.
 * - Stored in browser storage so the user remains logged in across browser sessions.
 * 
 * @param {JWTPayload} payload - Identity information to embed in the token
 * @returns {string} Signed JWT token string
 */
export function signJwt(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * verifyJwt
 * ----------------------------------------------------------------------------
 * HOW IT WORKS:
 * Decodes the token and verifies that the cryptographic signature matches our
 * secret and that the token has not expired.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - If valid, returns the typed `JWTPayload` containing `userId` and `email`.
 * - If invalid, tampered with, or expired, safely returns `null` instead of throwing.
 * 
 * @param {string} token - The raw JWT token string
 * @returns {JWTPayload | null} Validated payload or null if verification fails
 */
export function verifyJwt(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (err) {
    return null
  }
}

/**
 * getAuthUserFromRequest
 * ----------------------------------------------------------------------------
 * HOW IT WORKS:
 * Inspects incoming HTTP requests for the `Authorization` header, parses out the
 * 'Bearer <token>' substring, and executes `verifyJwt()`.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Used at the top of protected API route handlers:
 *   * /api/auth/me
 *   * /api/tasks (GET & POST)
 *   * /api/tasks/[id] (PATCH & DELETE)
 * - Returns 401 Unauthorized immediately if missing or invalid, preventing unauthorized DB access.
 * 
 * @param {Request} request - Next.js HTTP Request object
 * @returns {JWTPayload | null} Authenticated user payload or null if unauthorized
 */
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

