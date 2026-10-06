import { parseObjectId, requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const id = parseObjectId(getRouterParam(event, 'id'))
  const db = await useDb()
  const scope = { siteId: site.siteId, isDeleted: { $ne: true } }
  if (await db.collection('categories').countDocuments({ ...scope, parentId: String(id) })) {
    throw createError({ statusCode: 409, message: '하위 카테고리가 있어 삭제할 수 없습니다.' })
  }
  if (await db.collection('contents').countDocuments({ ...scope, categoryIds: String(id) })) {
    throw createError({ statusCode: 409, message: '연결된 콘텐츠가 있어 삭제할 수 없습니다.' })
  }
  const result = await db.collection('categories').updateOne({ ...scope, _id: id }, { $set: { isDeleted: true, deletedAt: new Date(), updatedAt: new Date() } })
  if (!result.matchedCount) throw createError({ statusCode: 404, message: '카테고리를 찾을 수 없습니다.' })
  return { ok: true }
})
