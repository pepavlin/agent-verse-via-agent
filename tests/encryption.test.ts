import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { encrypt, decrypt, createFingerprint } from '../lib/encryption'

// Set up a test encryption key (64 hex chars = 32 bytes)
const TEST_KEY = 'a'.repeat(64)

describe('encrypt / decrypt', () => {
  beforeEach(() => {
    vi.stubEnv('ENCRYPTION_KEY', TEST_KEY)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('encrypts a string and returns a colon-separated format', () => {
    const ciphertext = encrypt('hello world')
    const parts = ciphertext.split(':')
    expect(parts).toHaveLength(3)
    // Each part should be a non-empty base64 string
    parts.forEach((part) => expect(part.length).toBeGreaterThan(0))
  })

  it('decrypts back to the original plaintext', () => {
    const plaintext = 'sk-ant-api03-test-key-1234'
    const ciphertext = encrypt(plaintext)
    expect(decrypt(ciphertext)).toBe(plaintext)
  })

  it('produces different ciphertexts for the same plaintext (random IV)', () => {
    const plaintext = 'same-key-every-time'
    const c1 = encrypt(plaintext)
    const c2 = encrypt(plaintext)
    // Different IVs → different ciphertexts
    expect(c1).not.toBe(c2)
    // But both decrypt to the same value
    expect(decrypt(c1)).toBe(plaintext)
    expect(decrypt(c2)).toBe(plaintext)
  })

  it('handles empty string', () => {
    const ciphertext = encrypt('')
    expect(decrypt(ciphertext)).toBe('')
  })

  it('handles unicode characters', () => {
    const plaintext = 'Héllo Wörld — 日本語 🔑'
    expect(decrypt(encrypt(plaintext))).toBe(plaintext)
  })

  it('handles long strings', () => {
    const plaintext = 'x'.repeat(10_000)
    expect(decrypt(encrypt(plaintext))).toBe(plaintext)
  })

  it('throws when ENCRYPTION_KEY is missing', () => {
    vi.stubEnv('ENCRYPTION_KEY', '')
    expect(() => encrypt('test')).toThrow()
  })

  it('throws when ENCRYPTION_KEY is wrong length', () => {
    vi.stubEnv('ENCRYPTION_KEY', 'tooshort')
    expect(() => encrypt('test')).toThrow()
  })

  it('throws when ciphertext is tampered with', () => {
    const ciphertext = encrypt('original')
    // Tamper with the ciphertext (last part)
    const parts = ciphertext.split(':')
    parts[2] = Buffer.from('tampered').toString('base64')
    expect(() => decrypt(parts.join(':'))).toThrow()
  })

  it('throws when ciphertext format is invalid', () => {
    expect(() => decrypt('not-valid-ciphertext')).toThrow()
  })
})

describe('createFingerprint', () => {
  it('shows prefix and last 4 characters', () => {
    const fingerprint = createFingerprint('sk-ant-api03-abcdefghijklmnop')
    expect(fingerprint).toContain('sk-ant')
    expect(fingerprint).toContain('mnop')
    expect(fingerprint).toContain('...')
  })

  it('returns *** for very short keys', () => {
    expect(createFingerprint('short')).toBe('***')
  })

  it('never returns the full key', () => {
    const key = 'sk-ant-api03-very-long-key-here-1234'
    const fp = createFingerprint(key)
    expect(fp).not.toBe(key)
    expect(fp.length).toBeLessThan(key.length)
  })

  it('shows last 4 chars for a typical API key', () => {
    const key = 'sk-ant-api03-abcdefg1234'
    const fp = createFingerprint(key)
    expect(fp.endsWith('1234')).toBe(true)
  })
})
