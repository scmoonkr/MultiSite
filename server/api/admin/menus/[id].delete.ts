import { parseObjectId, requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'

// Removed for real rather than soft-deleted: {siteId, location} is unique, so a
// lingering row would block creating a new menu at the same location.
export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const id = parseObjectId(getRouterParam(event, 'id'))
  const db = await useDb()
  const result = await db.collection('menus').deleteOne({ _id: id, siteId: site.siteId })
  if (!result.deletedCount) throw createError({ statusCode: 404, message: '메뉴를 찾을 수 없습니다.' })
  return { ok: true }
})
