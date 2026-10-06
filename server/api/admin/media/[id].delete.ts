import { parseObjectId, requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const id = parseObjectId(getRouterParam(event, 'id'))
  const db = await useDb()
  const result = await db.collection('media').updateOne({ _id: id, siteId: site.siteId, isDeleted: { $ne: true } }, { $set: { isDeleted: true, deletedAt: new Date(), updatedAt: new Date() } })
  if (!result.matchedCount) throw createError({ statusCode: 404, message: '미디어를 찾을 수 없습니다.' })
  return { ok: true }
})
