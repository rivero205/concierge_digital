export type Message = { role: 'user' | 'assistant' | 'system'; content: string }

const GEMINI_MODEL = 'gemini-2.5-flash'

const TERMINAL_REASONS = new Set(['STOP', 'MAX_TOKENS', 'SAFETY', 'RECITATION', 'OTHER'])

export async function streamChat(
  messages: Message[],
  onChunk: (text: string) => void,
  onDone: () => void
) {
  const apiKey = import.meta.env.VITE_GEMINI_KEY

  const systemMsg = messages.find(m => m.role === 'system')
  const history = messages.filter(m => m.role !== 'system')

  const contents = history.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.7,
    },
  }

  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] }
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok || !res.body) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Gemini ${res.status}: ${errBody}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const lines = decoder.decode(value, { stream: true }).split('\n')
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (!data || data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data)
        const parts: Array<{ text?: string; thought?: boolean }> =
          parsed.candidates?.[0]?.content?.parts ?? []
        for (const part of parts) {
          if (part.text && !part.thought) onChunk(part.text)
        }
        const fr: string | undefined = parsed.candidates?.[0]?.finishReason
        if (fr && TERMINAL_REASONS.has(fr)) { onDone(); return }
      } catch { /* chunk incompleto */ }
    }
  }
  onDone()
}
