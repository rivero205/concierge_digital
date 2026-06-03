// services/scraper/src/index.ts
import 'dotenv/config'
import { ZONES } from './zones.js'
import { CATEGORIES } from './categories.js'
import { searchNearby, meetsQualityThreshold } from './google.js'
import { translateToSpanish } from './translate.js'
import { createPool, upsertPlace, upsertPhotos, upsertHours } from './db.js'

const API_KEY = process.env.GOOGLE_API_KEY!
const DB_URL  = process.env.DATABASE_URL!
const DELAY_MS = 200

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  if (!API_KEY) throw new Error('GOOGLE_API_KEY env var is required')
  if (!DB_URL)  throw new Error('DATABASE_URL env var is required')

  const pool = createPool(DB_URL)
  const seen = new Set<string>()

  let total = 0
  let skipped = 0

  console.log(`Starting scraper: ${CATEGORIES.length} categories × ${ZONES.length} zones = ${CATEGORIES.length * ZONES.length} requests\n`)

  for (const category of CATEGORIES) {
    console.log(`\n[${category.slug}] ${category.labelEs}`)

    for (const zone of ZONES) {
      process.stdout.write(`  ${zone.name}... `)

      try {
        const places = await searchNearby(
          API_KEY,
          zone,
          category.primaryTypes,
          category.excludeTypes,
        )

        let zoneCount = 0

        for (const place of places) {
          if (seen.has(place.id)) { skipped++; continue }
          if (!meetsQualityThreshold(place)) { skipped++; continue }

          seen.add(place.id)

          const summaryEs = await translateToSpanish(place.editorialSummary?.text ?? null)
          await sleep(50)

          const placeId = await upsertPlace(pool, place, category.slug, zone.name, summaryEs)
          await upsertPhotos(pool, placeId, place.photos)
          await upsertHours(pool, placeId, place.currentOpeningHours?.periods)

          zoneCount++
          total++
        }

        console.log(`${zoneCount} places`)
      } catch (err) {
        console.log(`ERROR: ${(err as Error).message}`)
      }

      await sleep(DELAY_MS)
    }
  }

  await pool.end()
  console.log(`\n✅ Done! ${total} unique places loaded (${skipped} skipped)`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
