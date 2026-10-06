import { requireAdminSite } from '../../utils/admin'
import { useDb } from '../../utils/mongo'
import { serializeSite } from '../../utils/site'

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const db = await useDb()
  const base = { siteId: site.siteId, isDeleted: { $ne: true } }
  const [posts, pages, categories, drafts] = await Promise.all([
    db.collection('contents').countDocuments({ ...base, contentType: 'post' }),
    db.collection('contents').countDocuments({ ...base, contentType: 'page' }),
    db.collection('categories').countDocuments(base),
    db.collection('contents').countDocuments({ ...base, status: 'draft' }),
  ])
  return { site: serializeSite(site), counts: { posts, pages, categories, drafts } }
})
