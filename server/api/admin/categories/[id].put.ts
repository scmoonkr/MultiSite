import { parseObjectId, requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { resolveCategoryParent, serializeCategory, uniqueCategorySlug, validateCategoryName } from '../../../utils/categories'

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const id = parseObjectId(getRouterParam(event, 'id'))
  const body = await readBody<any>(event)
  const db = await useDb()
  const scope = { _id: id, siteId: site.siteId, isDeleted: { $ne: true } }
  const current = await db.collection('categories').findOne(scope)
  if (!current) throw createError({ statusCode: 404, message: '카테고리를 찾을 수 없습니다.' })
  const update: any = { updatedAt: new Date() }
  if (body.name !== undefined) update.name = validateCategoryName(body.name)
  if (Number.isFinite(Number(body.order))) update.order = Number(body.order)
  if (typeof body.description === 'string') update.description = body.description.trim()
  const slugInput = typeof body.slug === 'string' ? body.slug.trim() : ''
  if (slugInput && slugInput !== current.slug) update.slug = await uniqueCategorySlug(db, site.siteId, slugInput, update.name || current.name, id)
  else if (!slugInput && update.name && update.name !== current.name) update.slug = await uniqueCategorySlug(db, site.siteId, '', update.name, id)
  if (Object.hasOwn(body, 'parentId')) update.parentId = await resolveCategoryParent(db, site.siteId, body.parentId, String(id))
  const result = await db.collection('categories').findOneAndUpdate(scope, { $set: update }, { returnDocument: 'after' })
  return { item: serializeCategory(result) }
})
