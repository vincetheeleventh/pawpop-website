// src/lib/utils.ts
import crypto from 'crypto'

/**
 * Generate a secure random token for artwork access
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate image file type
 */
export function isValidImageType(mimeType: string): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  return validTypes.includes(mimeType.toLowerCase())
}

/**
 * Format price in cents to dollars
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Generate artwork URL from token
 */
export function getArtworkUrl(token: string): string {
  return `/artwork/${token}`
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
}
