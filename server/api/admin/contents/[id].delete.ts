import { parseObjectId, requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'

// Deleting moves the content to the trash (status='deleted'). It stays in the
// DB and can be restored by changing its status back in the editor.
export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const id = parseObjectId(getRouterParam(event, 'id'))
  const db = await useDb()
  const result = await db.collection('contents').updateOne(
    { _id: id, siteId: site.siteId, isDeleted: { $ne: true } },
    { $set: { status: 'deleted', updatedAt: new Date() } },
  )
  if (!result.matchedCount) throw createError({ statusCode: 404, statusMessage: '콘텐츠를 찾을 수 없습니다.' })
  return { ok: true }
})
