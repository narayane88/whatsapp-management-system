import { Pool } from 'pg'

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'whatsapp_system',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'Nitin@123',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  return pool
}

export async function query(text: string, params?: any[]) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

export async function getClient() {
  const pool = getPool()
  return await pool.connect()
}

// Helper function to check user subscription access
export async function checkUserAccess(userId: number, feature: string): Promise<boolean> {
  try {
    const result = await query(
      'SELECT user_has_feature($1, $2) as has_access',
      [userId, feature]
    )
    return result.rows[0]?.has_access || false
  } catch (error) {
    console.error('Error checking user access:', error)
    return false
  }
}

// Helper function to get user limits
export async function getUserLimit(userId: number, limitName: string): Promise<number> {
  try {
    const result = await query(
      'SELECT get_user_limit($1, $2) as limit_value',
      [userId, limitName]
    )
    return result.rows[0]?.limit_value || 0
  } catch (error) {
    console.error('Error getting user limit:', error)
    return 0
  }
}