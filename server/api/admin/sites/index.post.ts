import { requireAdmin } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { cleanHost, slugify } from '../../../utils/http'
import { serializeSite } from '../../../utils/site'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<any>(event)
  const siteId = slugify(body.siteId)
  const name = String(body.name || '').trim()
  const domains = [...new Set((Array.isArray(body.domains) ? body.domains : String(body.primaryDomain || '').split(','))
    .map(cleanHost).filter(Boolean))]
  if (!siteId || !name || !domains.length) {
    throw createError({ statusCode: 400, statusMessage: 'siteId, 사이트명, 도메인은 필수입니다.' })
  }
  const now = new Date()
  const doc = {
    siteId,
    name,
    description: String(body.description || '').trim(),
    domains,
    primaryDomain: domains[0],
    status: ['active', 'disabled', 'maintenance'].includes(body.status) ? body.status : 'active',
    enabledFeatures: Array.isArray(body.enabledFeatures) ? body.enabledFeatures.map(String) : [],
    theme: body.theme || {},
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  }
  const db = await useDb()
  try {
    const result = await db.collection('sites').insertOne(doc)
    return { site: serializeSite({ ...doc, _id: result.insertedId }) }
  } catch (error: any) {
    if (error?.code === 11000) throw createError({ statusCode: 409, statusMessage: 'siteId 또는 도메인이 이미 사용 중입니다.' })
    throw error
  }
})
