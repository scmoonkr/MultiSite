import { timingSafeEqual } from 'node:crypto'
import { createAdminSession } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ key?: string }>(event)
  const config = useRuntimeConfig(event)
  const configured = String(config.adminKey || process.env.NUXT_ADMIN_KEY || process.env.ADMIN_KEY || '')
  const provided = String(body?.key || '')
  if (!configured) {
    throw createError({ statusCode: 500, statusMessage: 'ADMIN_KEY가 설정되지 않았습니다.' })
  }
  if (configured.length < 12) {
    throw createError({ statusCode: 500, statusMessage: 'ADMIN_KEY는 12자 이상이어야 합니다.' })
  }
  if (String(config.sessionSecret || process.env.NUXT_SESSION_SECRET || process.env.SESSION_SECRET || '').length < 16) {
    throw createError({ statusCode: 500, statusMessage: 'SESSION_SECRET은 16자 이상이어야 합니다.' })
  }
  const valid = configured.length >= 12
    && provided.length === configured.length
    && timingSafeEqual(Buffer.from(provided), Buffer.from(configured))
  if (!valid) throw createError({ statusCode: 401, statusMessage: '관리자 키가 올바르지 않습니다.' })
  createAdminSession(event)
  return { ok: true }
})
