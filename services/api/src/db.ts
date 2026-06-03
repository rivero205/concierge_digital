// services/api/src/db.ts
import pg from 'pg'

const { Pool } = pg

let _pool: pg.Pool | null = null

export function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    })
  }
  return _pool
}
