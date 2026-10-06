import { parseObjectId, requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { ACCESS_LEVELS, CONTENT_STATUSES, compileMarkdown, normalizeIdList, serializeContent, uniqueSlug } from '../../../utils/content'
import { resolveTagIds } from '../../../utils/tags'

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const id = parseObjectId(getRouterParam(event, 'id'))
  const body = await readBody<any>(event)
  const db = await useDb()
  const collection = db.collection('contents')
  const current = await collection.findOne({ _id: id, siteId: site.siteId, isDeleted: { $ne: true } })
  if (!current) throw createError({ statusCode: 404, statusMessage: '콘텐츠를 찾을 수 없습니다.' })
  const has = (key: string) => Object.hasOwn(body, key)
  const title = has('title') ? String(body.title || '').trim() : current.title
  if (!title) throw createError({ statusCode: 400, statusMessage: '제목은 필수입니다.' })
  const slug = await uniqueSlug(collection, site.siteId, body.slug || current.slug, title, id)
  const markdown = has('markdown') ? String(body.markdown || '') : (current.markdown || '')
  const compiled = await compileMarkdown(db, site.siteId, markdown)
  const status = CONTENT_STATUSES.includes(body.status) ? body.status : current.status
  const update: any = { title, slug, markdown, ...compiled, status, updatedAt: new Date() }
  if (has('summary')) update.summary = String(body.summary || '').trim().slice(0, 500)
  if (has('template')) update.template = typeof body.template === 'string' ? body.template : null
  if (has('categoryIds')) update.categoryIds = normalizeIdList(body.categoryIds)
  if (Array.isArray(body.tagNames)) update.tagIds = await resolveTagIds(db, site.siteId, body.tagNames)
  if (has('thumbnailImageId')) update.thumbnailImageId = normalizeIdList([body.thumbnailImageId])[0] || null
  if (has('accessLevel')) update.accessLevel = ACCESS_LEVELS.includes(body.accessLevel) ? body.accessLevel : 'public'
  if (has('meta') || has('featured')) {
    update.meta = { ...(body.meta && typeof body.meta === 'object' ? body.meta : current.meta || {}) }
    if (has('featured')) update.meta.featured = !!body.featured
  }
  if (status === 'published' && !current.publishedAt) update.publishedAt = new Date()
  if (current.status === 'published' && current.slug !== slug) {
    await db.collection('redirects').updateOne(
      { siteId: site.siteId, fromPath: `/${current.contentType}/${current.slug}` },
      { $set: { toPath: `/${current.contentType}/${slug}`, statusCode: 301, contentId: id, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    )
  }
  const result = await collection.findOneAndUpdate({ _id: id, siteId: site.siteId }, { $set: update, $unset: { html: '' } }, { returnDocument: 'after' })
  return { content: serializeContent(result) }
})
