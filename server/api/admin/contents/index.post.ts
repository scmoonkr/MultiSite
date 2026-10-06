import { requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { ACCESS_LEVELS, CONTENT_STATUSES, compileMarkdown, normalizeIdList, serializeContent, uniqueSlug } from '../../../utils/content'
import { resolveTagIds } from '../../../utils/tags'

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const body = await readBody<any>(event)
  const contentType = ['post', 'page'].includes(body.contentType) ? body.contentType : null
  const title = String(body.title || '').trim()
  if (!contentType || !title) throw createError({ statusCode: 400, statusMessage: '콘텐츠 종류와 제목은 필수입니다.' })
  const db = await useDb()
  const collection = db.collection('contents')
  const markdown = String(body.markdown || '')
  const compiled = await compileMarkdown(db, site.siteId, markdown)
  const slug = await uniqueSlug(collection, site.siteId, body.slug, title)
  const status = CONTENT_STATUSES.includes(body.status) ? body.status : 'draft'
  const now = new Date()
  const tagIds = await resolveTagIds(db, site.siteId, body.tagNames)
  const meta = { ...(body.meta && typeof body.meta === 'object' ? body.meta : {}) }
  if (Object.hasOwn(body, 'featured')) meta.featured = !!body.featured
  const doc = {
    siteId: site.siteId,
    contentType,
    title,
    slug,
    summary: String(body.summary || '').trim().slice(0, 500),
    markdown,
    ...compiled,
    template: typeof body.template === 'string' ? body.template : null,
    categoryIds: normalizeIdList(body.categoryIds),
    tagIds,
    thumbnailImageId: normalizeIdList([body.thumbnailImageId])[0] || null,
    status,
    visibility: 'public',
    accessLevel: ACCESS_LEVELS.includes(body.accessLevel) ? body.accessLevel : 'public',
    meta,
    publishedAt: status === 'published' ? now : null,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  }
  const result = await collection.insertOne(doc)
  setResponseStatus(event, 201)
  return { content: serializeContent({ ...doc, _id: result.insertedId }) }
})
