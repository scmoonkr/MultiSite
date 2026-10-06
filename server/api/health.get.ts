import { useDb, buildMongoConnectionOptions } from '../utils/mongo'

export default defineEventHandler(async (event) => {
  try {
    const db = await useDb()
    await db.command({ ping: 1 })
    const { database, username, hasPassword } = buildMongoConnectionOptions()
    return { ok: true, database, username: username || null, authenticated: hasPassword }
  } catch (error: any) {
    console.error('[mongo] health check failed:', error instanceof Error ? error.message : String(error))
    setResponseStatus(event, 503)
    return { ok: false, error: 'MongoDB에 연결할 수 없습니다.' }
  }
})
