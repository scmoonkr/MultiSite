import { resolvePublicSite } from '../../../utils/site'
import { useDb } from '../../../utils/mongo'
import { publicContentFilter, serializeContentSummary } from '../../../utils/content'

export default defineEventHandler(async (event) => {
  const site = await resolvePublicSite(event)
  const query = getQuery(event)
  const contentType = ['post', 'page'].includes(String(query.type)) ? String(query.type) : undefined
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 12))
  const filter: any = publicContentFilter(site.siteId)
  if (contentType) filter.contentType = contentType
  if (query.category) filter.categoryIds = String(query.category)
  if (query.tag) filter.tagIds = String(query.tag)
  const db = await useDb()
  const collection = db.collection('contents')
  const [items, total] = await Promise.all([
    collection.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    collection.countDocuments(filter),
  ])
  return { items: items.map(serializeContentSummary), total, page, limit }
})
