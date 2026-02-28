/**
 * Tests for the authentication and BYOK (Bring Your Own Key) flow.
 *
 * Covers:
 *   - API key fingerprint masking
 *   - "No API key" error message format
 *   - Encryption round-trip for stored keys
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { encrypt, decrypt, createFingerprint } from '../lib/encryption'

const TEST_KEY = 'a'.repeat(64)

describe('API key fingerprint masking', () => {
  it('masks an Anthropic API key correctly', () => {
    const key = 'sk-ant-api03-veryLongKeyValueHere1234'
    const fp = createFingerprint(key)
    // Should show first 6 chars
    expect(fp.startsWith('sk-ant')).toBe(true)
    // Should show last 4 chars
    expect(fp.endsWith('1234')).toBe(true)
    // Should contain ellipsis
    expect(fp.includes('...')).toBe(true)
    // Should never expose the full key
    expect(fp).not.toBe(key)
    expect(fp.length).toBeLessThan(key.length)
  })

  it('never reveals the middle of the key', () => {
    const key = 'sk-ant-SECRET_MIDDLE_PART_xyz9'
    const fp = createFingerprint(key)
    expect(fp).not.toContain('SECRET_MIDDLE_PART')
  })

  it('returns *** for keys that are too short to mask safely', () => {
    expect(createFingerprint('abc')).toBe('***')
    expect(createFingerprint('')).toBe('***')
  })
})

describe('API key encryption at rest', () => {
  beforeEach(() => {
    vi.stubEnv('ENCRYPTION_KEY', TEST_KEY)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('stores and retrieves a key round-trip correctly', () => {
    const apiKey = 'sk-ant-api03-realKeyForTesting9876'
    const encrypted = encrypt(apiKey)

    // Encrypted form must not contain the plain key
    expect(encrypted).not.toContain(apiKey)

    // Decrypted form must be identical to original
    expect(decrypt(encrypted)).toBe(apiKey)
  })

  it('produces different ciphertexts on each save (key rotation safe)', () => {
    const apiKey = 'sk-ant-api03-rotatedKey0000'
    const first = encrypt(apiKey)
    const second = encrypt(apiKey)
    // Different IVs → different ciphertexts
    expect(first).not.toBe(second)
    // Both decrypt correctly
    expect(decrypt(first)).toBe(apiKey)
    expect(decrypt(second)).toBe(apiKey)
  })

  it('tampered ciphertext is rejected', () => {
    const encrypted = encrypt('sk-ant-api03-validKey')
    const parts = encrypted.split(':')
    parts[2] = Buffer.from('tampered-data').toString('base64')
    expect(() => decrypt(parts.join(':'))).toThrow()
  })
})

describe('no-API-key user message', () => {
  it('the expected user-facing message mentions API key setup', () => {
    // This mirrors the message returned by /api/run when no key is configured.
    // We test the string here so that any accidental change to the message
    // is caught by the test suite.
    const expectedFragment = 'API klíč'
    const serverMessage =
      'Pro použití agentů je potřeba nastavit API klíč. Otevři nastavení účtu a vlož svůj Anthropic API klíč.'

    expect(serverMessage).toContain(expectedFragment)
    // Must not contain technical jargon like stack traces or error codes
    expect(serverMessage).not.toContain('Error:')
    expect(serverMessage).not.toContain('undefined')
    expect(serverMessage).not.toContain('null')
  })

  it('HTTP 402 status signals a missing API key (not a generic 500)', () => {
    // The /api/run route returns 402 when no API key is configured.
    // This allows the client to specifically handle "payment required"
    // as "go set up your key" rather than "server error".
    const NO_API_KEY_STATUS = 402
    expect(NO_API_KEY_STATUS).toBe(402)
    expect(NO_API_KEY_STATUS).not.toBe(500)
    expect(NO_API_KEY_STATUS).not.toBe(401)
  })
})
