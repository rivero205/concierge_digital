# Concierge Digital — Chat MVP Design

## Goal
Add an AI-powered chat widget to the existing Vite/React frontend that makes the product feel like a full concierge service. Simple code, premium feel.

## Architecture

```
src/
  lib/
    openrouter.ts        ← streaming fetch wrapper
    concierge-prompt.ts  ← master system prompt
  components/
    ConciergeChat.tsx    ← floating chat widget
  App.tsx                ← mount widget
.env                     ← VITE_OPENROUTER_KEY, VITE_AI_MODEL
```

No backend. Direct calls from React to OpenRouter API.

## Functional Behavior

Single open conversation. User types anything — the AI detects intent and responds in the right format:

| User intent | AI response format |
|---|---|
| Hotel question | 3 options with name, zone, price range, vibe |
| Restaurant/food | 3 options with cuisine, neighborhood, tip |
| Transport | Step-by-step route or mode recommendation |
| Match day | Full timeline: before → stadium → after |
| Itinerary | Day plan with times and locations |
| General question | Conversational, concise, premium tone |

## System Prompt Strategy

One master prompt that:
- Establishes persona: premium FIFA 2026 México concierge
- Instructs AI to auto-detect intent from free text
- Defines response format per intent (markdown with emoji icons)
- Keeps responses concise and actionable (no walls of text)
- Covers: CDMX, Guadalajara, Monterrey as host cities
- Hardcodes 5-6 real hotel names, 5-6 real restaurants per city as ground truth
- Includes FIFA 2026 context: dates June-July 2026, 3 México venues

## Chat Widget

- Floating button bottom-right (doesn't interfere with existing sections)
- Opens as a panel (not full screen)
- Streaming: text appears word by word via ReadableStream
- Quick action chips on first open: Hotels · Food · Transport · Match Day · Plan my trip
- Maintains conversation history (last 10 messages for context)
- No persistence — session only (MVP)

## AI Config

- Provider: OpenRouter
- Model: deepseek/deepseek-chat (DeepSeek V3)
- Streaming: yes (stream: true)
- Max tokens: 600 per response
- Temperature: 0.7
- Context window: last 10 messages

## Cost Control

- Max 10 messages kept in context (older dropped)
- Max 600 output tokens per response
- DeepSeek V3 via OpenRouter: ~$0.14/M input tokens, ~$0.28/M output — essentially free for MVP

## What Makes It Feel Premium

1. Streaming (typing effect feels alive)
2. Structured markdown responses rendered as rich text
3. Quick chips eliminate blank-slate friction
4. AI always responds with specific names/places — never vague
5. Tone: warm, knowledgeable, premium — like a real hotel concierge
