import { requireAdmin, parseObjectId } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'

// Removes the site record itself so its siteId and domains (both unique) can be
// reused. The site's contents, categories, menus and media are left in place.
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = parseObjectId(getRouterParam(event, 'id'))
  const db = await useDb()
  const result = await db.collection('sites').deleteOne({ _id: id })
  if (!result.deletedCount) throw createError({ statusCode: 404, message: '사이트를 찾을 수 없습니다.' })
  return { ok: true }
})
