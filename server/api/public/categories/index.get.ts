import { resolvePublicSite } from '../../../utils/site'
import { useDb } from '../../../utils/mongo'
import { publicContentFilter } from '../../../utils/content'

export default defineEventHandler(async (event) => {
  const site = await resolvePublicSite(event)
  const db = await useDb()
  const categories = await db.collection('categories').find({ siteId: site.siteId, isDeleted: { $ne: true } }).sort({ order: 1, name: 1 }).toArray()
  const items = await Promise.all(categories.map(async category => ({
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    order: category.order || 0,
    postCount: await db.collection('contents').countDocuments({
      ...publicContentFilter(site.siteId),
      contentType: 'post',
      categoryIds: String(category._id),
    }),
  })))
  return { items }
})
