import { requireAdmin, setAdminSite } from '../../utils/admin'
import { useDb } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ siteId?: string }>(event)
  const siteId = String(body.siteId || '')
  const db = await useDb()
  const exists = await db.collection('sites').findOne({ siteId, isDeleted: { $ne: true } }, { projection: { _id: 1 } })
  if (!exists) throw createError({ statusCode: 404, statusMessage: '사이트를 찾을 수 없습니다.' })
  setAdminSite(event, siteId)
  return { ok: true, siteId }
})
