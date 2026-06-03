// services/scraper/src/translate.ts

export async function translateToSpanish(text: string | null | undefined): Promise<string | null> {
  if (!text?.trim()) return null

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null

    const translated = (data[0] as [string, ...unknown[]][])
      .map(segment => segment[0])
      .join('')

    return translated || null
  } catch {
    return null
  }
}
