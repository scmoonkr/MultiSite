import { requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event); const db = await useDb()
  const rows = await db.collection('tags').find({ siteId: site.siteId, isDeleted: { $ne: true } }).sort({ name: 1 }).toArray()
  const items = await Promise.all(rows.map(async row => ({ id: String(row._id), name: row.name, slug: row.slug, postCount: await db.collection('contents').countDocuments({ siteId: site.siteId, tagIds: String(row._id), isDeleted: { $ne: true } }) })))
  return { items }
})
