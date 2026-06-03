// services/api/src/routes/categories.ts
import { Router } from 'express'
import { getPool } from '../db.js'

export const categoriesRouter = Router()

categoriesRouter.get('/', async (_req, res) => {
  try {
    const { rows } = await getPool().query<{ slug: string; count: number }>(
      `SELECT
         platform_category AS slug,
         COUNT(*)::int      AS count
       FROM places
       WHERE business_status = 'OPERATIONAL'
       GROUP BY platform_category
       ORDER BY count DESC`,
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})
