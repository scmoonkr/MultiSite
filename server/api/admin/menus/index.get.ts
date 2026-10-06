import { requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { serializeMenu } from '../../../utils/menus'

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const db = await useDb()
  const rows = await db.collection('menus').find({ siteId: site.siteId, isDeleted: { $ne: true } }).sort({ location: 1, name: 1 }).toArray()
  return { items: rows.map(serializeMenu) }
})
