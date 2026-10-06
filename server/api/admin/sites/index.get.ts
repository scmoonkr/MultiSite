import { requireAdmin } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { serializeSite } from '../../../utils/site'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const db = await useDb()
  const sites = await db.collection('sites').find({ isDeleted: { $ne: true } }).sort({ name: 1 }).toArray()
  return { items: sites.map(serializeSite) }
})
