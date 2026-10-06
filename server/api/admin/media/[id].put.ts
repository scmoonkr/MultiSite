import { parseObjectId, requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { serializeMedia } from '../../../utils/media'

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const id = parseObjectId(getRouterParam(event, 'id'))
  const body = await readBody<any>(event)
  const update: any = { updatedAt: new Date() }
  for (const key of ['title', 'alt', 'caption', 'description']) {
    if (typeof body?.[key] === 'string') update[key] = body[key]
  }
  const db = await useDb()
  const result = await db.collection('media').findOneAndUpdate({ _id: id, siteId: site.siteId, isDeleted: { $ne: true } }, { $set: update }, { returnDocument: 'after' })
  if (!result) throw createError({ statusCode: 404, message: '미디어를 찾을 수 없습니다.' })
  return { item: serializeMedia(result) }
})
