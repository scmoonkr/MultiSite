import { requireAdmin, parseObjectId } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { cleanHost } from '../../../utils/http'
import { serializeSite } from '../../../utils/site'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = parseObjectId(getRouterParam(event, 'id'))
  const body = await readBody<any>(event)
  const domains = [...new Set((body.domains || []).map(cleanHost).filter(Boolean))]
  const update = {
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim(),
    domains,
    primaryDomain: cleanHost(body.primaryDomain) || domains[0],
    status: ['active', 'disabled', 'maintenance'].includes(body.status) ? body.status : 'active',
    enabledFeatures: Array.isArray(body.enabledFeatures) ? body.enabledFeatures.map(String) : [],
    theme: body.theme || {},
    updatedAt: new Date(),
  }
  if (!update.name || !update.domains.length) throw createError({ statusCode: 400, statusMessage: '사이트명과 도메인은 필수입니다.' })
  const db = await useDb()
  const result = await db.collection('sites').findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, { $set: update }, { returnDocument: 'after' }).catch((error: any) => {
    if (error?.code === 11000) throw createError({ statusCode: 409, statusMessage: '도메인이 이미 다른 사이트에서 사용 중입니다.' })
    throw error
  })
  if (!result) throw createError({ statusCode: 404, statusMessage: '사이트를 찾을 수 없습니다.' })
  return { site: serializeSite(result) }
})
