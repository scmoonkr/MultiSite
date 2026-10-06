import { resolvePublicSite } from '../../../utils/site'
import { useDb } from '../../../utils/mongo'
import { publicContentFilter } from '../../../utils/content'
export default defineEventHandler(async (event) => {
  const site = await resolvePublicSite(event); const db = await useDb()
  const rows = await db.collection('tags').find({ siteId: site.siteId, isDeleted: { $ne: true } }).sort({ name: 1 }).toArray()
  return { items: await Promise.all(rows.map(async row => ({ id: String(row._id), name: row.name, slug: row.slug, postCount: await db.collection('contents').countDocuments({ ...publicContentFilter(site.siteId), tagIds: String(row._id) }) }))) }
})
