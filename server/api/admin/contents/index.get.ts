import { requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { CONTENT_STATUSES, serializeContentSummary } from '../../../utils/content'

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const query = getQuery(event)
  const limit = Math.min(200, Math.max(1, Number(query.limit) || 50))
  const skip = Math.max(0, Number(query.skip) || (Math.max(1, Number(query.page) || 1) - 1) * limit)
  const filter: any = { siteId: site.siteId, isDeleted: { $ne: true } }
  if (['post', 'page'].includes(String(query.type))) filter.contentType = String(query.type)
  // Trashed items (status='deleted') only show up when asked for explicitly.
  filter.status = CONTENT_STATUSES.includes(String(query.status)) ? String(query.status) : { $ne: 'deleted' }
  const db = await useDb()
  const collection = db.collection('contents')
  const [rows, total] = await Promise.all([
    collection.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments(filter),
  ])
  return { items: rows.map(serializeContentSummary), total, skip, limit }
})
