// services/api/src/index.ts
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { placesRouter } from './routes/places.js'
import { categoriesRouter } from './routes/categories.js'
import { getPool } from './db.js'

const app = express()
const PORT = parseInt(process.env.PORT ?? '3001')

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET'],
}))
app.use(express.json())

app.get('/health', async (_req, res) => {
  try {
    const { rows } = await getPool().query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM places WHERE business_status = 'OPERATIONAL'`,
    )
    res.json({ status: 'ok', placesCount: rows[0].count })
  } catch {
    res.status(503).json({ status: 'error', placesCount: 0 })
  }
})

app.use('/api/categories', categoriesRouter)
app.use('/api/places',     placesRouter)

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})
