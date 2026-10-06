import { requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { serializeCategory } from '../../../utils/categories'

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const db = await useDb()
  const rows = await db.collection('categories').find({ siteId: site.siteId, isDeleted: { $ne: true } }).sort({ order: 1, name: 1 }).toArray()
  return { items: rows.map(serializeCategory) }
})
