import { resolvePublicSite } from '../../../utils/site'
import { useDb } from '../../../utils/mongo'
import { publicContentFilter, serializeContentSummary } from '../../../utils/content'
export default defineEventHandler(async (event) => {
  const site = await resolvePublicSite(event); const slug = String(getRouterParam(event, 'slug') || ''); const db = await useDb()
  const tag = await db.collection('tags').findOne({ siteId: site.siteId, slug, isDeleted: { $ne: true } })
  if (!tag) throw createError({ statusCode: 404, statusMessage: '태그를 찾을 수 없습니다.' })
  const items = await db.collection('contents').find({ ...publicContentFilter(site.siteId), tagIds: String(tag._id) }).sort({ publishedAt: -1 }).toArray()
  return { tag: { id: String(tag._id), name: tag.name, slug: tag.slug }, items: items.map(serializeContentSummary) }
})
