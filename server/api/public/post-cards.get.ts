import { resolvePublicSite } from '../../utils/site'
import { useDb } from '../../utils/mongo'
import { publicContentFilter } from '../../utils/content'
import { getMediaByIds } from '../../utils/media'

// Published posts as card data, filtered by category and/or tag slugs.
// Used by the `postList` block and the sidebar template's "최근 글" widget.
export default defineEventHandler(async (event) => {
  const site = await resolvePublicSite(event)
  const query = getQuery(event)
  const parseCsv = (value: unknown) => String(value || '').split(',').map(item => item.trim()).filter(Boolean)
  const categorySlugs = parseCsv(query.categories)
  const tagSlugs = parseCsv(query.tags)
  const limit = Math.min(24, Math.max(1, Number(query.limit) || 6))
  const db = await useDb()

  // Resolve slugs → ids. Unknown slugs are dropped so a typo doesn't 500.
  const idsBySlug = async (collection: string, slugs: string[]) => slugs.length
    ? (await db.collection(collection).find({ siteId: site.siteId, slug: { $in: slugs }, isDeleted: { $ne: true } }, { projection: { _id: 1 } }).toArray()).map(row => String(row._id))
    : []
  const [categoryIds, tagIds] = await Promise.all([idsBySlug('categories', categorySlugs), idsBySlug('tags', tagSlugs)])

  const filter: any = { ...publicContentFilter(site.siteId), contentType: 'post' }
  if (categorySlugs.length) {
    if (!categoryIds.length) return { items: [] }
    filter.categoryIds = { $in: categoryIds }
  }
  if (tagSlugs.length) {
    if (!tagIds.length) return { items: [] }
    filter.tagIds = { $in: tagIds }
  }

  const posts = await db.collection('contents').find(filter).sort({ publishedAt: -1 }).limit(limit).toArray()
  const mediaMap = await getMediaByIds(db, site.siteId, posts.map(post => post.thumbnailImageId).filter(Boolean))

  return {
    items: posts.map(post => ({
      id: String(post._id),
      title: post.title || '',
      slug: post.slug || '',
      summary: post.summary || '',
      publishedAt: post.publishedAt,
      featured: !!post.meta?.featured,
      thumbnailUrl: post.thumbnailImageId ? (mediaMap[String(post.thumbnailImageId)]?.paths?.original || '') : '',
      author: null,
    })),
  }
})
