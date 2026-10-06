import { resolvePublicSite } from '../../../utils/site'
import { useDb } from '../../../utils/mongo'
import { publicContentFilter, serializeContentSummary } from '../../../utils/content'
import { getMediaByIds } from '../../../utils/media'
import { getLabelsByIds } from '../../../utils/labels'

export default defineEventHandler(async (event) => {
  const site = await resolvePublicSite(event)
  const slug = String(getRouterParam(event, 'slug') || '')
  const query = getQuery(event)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20))
  const skip = Math.max(0, Number(query.skip) || 0)
  const db = await useDb()
  const category = await db.collection('categories').findOne({ siteId: site.siteId, slug, isDeleted: { $ne: true } })
  if (!category) throw createError({ statusCode: 404, statusMessage: '카테고리를 찾을 수 없습니다.' })

  const filter: any = { ...publicContentFilter(site.siteId), categoryIds: String(category._id) }
  filter.contentType = ['post', 'page'].includes(String(query.type)) ? String(query.type) : 'post'
  const collection = db.collection('contents')
  const [rows, total] = await Promise.all([
    collection.find(filter).sort({ publishedAt: -1, updatedAt: -1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments(filter),
  ])
  const summaries = rows.map(serializeContentSummary)

  // Batch lookup thumbnails + category/tag labels for the whole page of cards.
  const [mediaMap, categories, tags] = await Promise.all([
    getMediaByIds(db, site.siteId, summaries.map(item => item.thumbnailImageId).filter(Boolean)),
    getLabelsByIds(db, 'categories', site.siteId, summaries.flatMap(item => item.categoryIds)),
    getLabelsByIds(db, 'tags', site.siteId, summaries.flatMap(item => item.tagIds || [])),
  ])
  const categoryById = Object.fromEntries(categories.map(label => [label.id, label]))
  const tagById = Object.fromEntries(tags.map(label => [label.id, label]))

  return {
    category: { id: String(category._id), name: category.name, slug: category.slug, description: category.description || '' },
    items: summaries.map(item => ({
      ...item,
      authorId: null,
      categoryLabels: item.categoryIds.map(id => categoryById[id]).filter(Boolean),
      tagLabels: (item.tagIds || []).map(id => tagById[id]).filter(Boolean),
    })),
    total,
    mediaMap,
    authorMap: {},
  }
})
