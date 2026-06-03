import { describe, it, expect, vi } from 'vitest'
import { translateToSpanish } from './translate.js'

describe('translateToSpanish', () => {
  it('returns null for empty input', async () => {
    expect(await translateToSpanish('')).toBeNull()
  })

  it('returns null for null input', async () => {
    expect(await translateToSpanish(null)).toBeNull()
  })

  it('returns null when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const result = await translateToSpanish('Hello world')
    expect(result).toBeNull()
    vi.unstubAllGlobals()
  })

  it('returns null on bad response shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => 'unexpected',
    }))
    const result = await translateToSpanish('Hello world')
    expect(result).toBeNull()
    vi.unstubAllGlobals()
  })
})
