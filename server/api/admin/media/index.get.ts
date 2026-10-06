import { requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { serializeMedia } from '../../../utils/media'

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const db = await useDb()
  const rows = await db.collection('media').find({ siteId: site.siteId, isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(500).toArray()
  return { items: rows.map(serializeMedia) }
})
