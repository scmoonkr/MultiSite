import { requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { resolveCategoryParent, serializeCategory, uniqueCategorySlug, validateCategoryName } from '../../../utils/categories'

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const body = await readBody<any>(event)
  const name = validateCategoryName(body.name)
  const db = await useDb()
  const now = new Date()
  const doc = {
    siteId: site.siteId,
    name,
    slug: await uniqueCategorySlug(db, site.siteId, body.slug, name),
    description: String(body.description || '').trim(),
    parentId: await resolveCategoryParent(db, site.siteId, body.parentId),
    order: Number(body.order) || 0,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  }
  const result = await db.collection('categories').insertOne(doc)
  setResponseStatus(event, 201)
  return { item: serializeCategory({ ...doc, _id: result.insertedId }) }
})
