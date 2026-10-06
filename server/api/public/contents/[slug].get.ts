import { resolvePublicSite } from '../../../utils/site'
import { useDb } from '../../../utils/mongo'
import { isAdmin } from '../../../utils/admin'
import { collectImageIds, publicContentFilter, resolveSiteContentBlocks, serializeContent } from '../../../utils/content'
import { getMediaByIds } from '../../../utils/media'
import { getLabelsByIds } from '../../../utils/labels'

export default defineEventHandler(async (event) => {
  const site = await resolvePublicSite(event)
  const slug = String(getRouterParam(event, 'slug') || '')
  const type = String(getQuery(event).type || '')
  const filter: any = { ...publicContentFilter(site.siteId, { anyAccess: true }), slug }
  if (['post', 'page'].includes(type)) filter.contentType = type
  const db = await useDb()
  const doc = await db.collection('contents').findOne(filter)
  if (!doc) throw createError({ statusCode: 404, statusMessage: '콘텐츠를 찾을 수 없습니다.' })

  // Role gate. MultiSite has no member accounts, so any non-public level is
  // visible to a logged-in admin only.
  const accessLevel = doc.accessLevel || 'public'
  if (accessLevel !== 'public' && !isAdmin(event)) {
    return { locked: true, accessLevel, requiresLogin: true, title: doc.title, contentType: doc.contentType, slug: doc.slug }
  }

  // The markdown source is for the editor only; public pages render from blocks.
  const { markdown: _markdown, ...content } = serializeContent(doc)
  content.blocks = await resolveSiteContentBlocks(db, content.blocks)
  const [mediaMap, categoryLabels, tagLabels] = await Promise.all([
    getMediaByIds(db, site.siteId, [...collectImageIds(content.blocks), content.thumbnailImageId].filter(Boolean)),
    getLabelsByIds(db, 'categories', site.siteId, content.categoryIds),
    getLabelsByIds(db, 'tags', site.siteId, content.tagIds || []),
  ])
  return { content, mediaMap, categoryLabels, tagLabels, author: null }
})
