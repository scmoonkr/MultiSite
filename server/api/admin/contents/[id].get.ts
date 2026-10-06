import { parseObjectId, requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { serializeContent } from '../../../utils/content'
import { getLabelsByIds } from '../../../utils/labels'

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const id = parseObjectId(getRouterParam(event, 'id'))
  const db = await useDb()
  const content = await db.collection('contents').findOne({ _id: id, siteId: site.siteId, isDeleted: { $ne: true } })
  if (!content) throw createError({ statusCode: 404, statusMessage: '콘텐츠를 찾을 수 없습니다.' })
  const tags = await getLabelsByIds(db, 'tags', site.siteId, content.tagIds || [])
  return { content: { ...serializeContent(content), tagNames: tags.map(tag => tag.name) } }
})
