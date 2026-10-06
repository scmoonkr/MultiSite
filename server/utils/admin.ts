import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { ObjectId } from 'mongodb'
import { useDb } from './mongo'

const SESSION_COOKIE = 'multisite-admin'
const SITE_COOKIE = 'multisite-admin-site'

function secret(event: H3Event) {
  const config = useRuntimeConfig(event)
  const sessionSecret = String(config.sessionSecret || process.env.NUXT_SESSION_SECRET || process.env.SESSION_SECRET || '')
  if (sessionSecret.length < 16) {
    throw createError({ statusCode: 500, statusMessage: 'SESSION_SECRET을 16자 이상으로 설정하세요.' })
  }
  return sessionSecret
}

function signature(event: H3Event, payload: string) {
  return createHmac('sha256', secret(event)).update(payload).digest('base64url')
}

export function createAdminSession(event: H3Event) {
  const expires = Date.now() + 1000 * 60 * 60 * 12
  const payload = `admin.${expires}`
  setCookie(event, SESSION_COOKIE, `${payload}.${signature(event, payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  })
}

export function clearAdminSession(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
  deleteCookie(event, SITE_COOKIE, { path: '/' })
}

export function requireAdmin(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE) || ''
  const [role, expiresRaw, provided = ''] = token.split('.')
  const payload = `${role}.${expiresRaw}`
  const expected = signature(event, payload)
  const validSignature = provided.length === expected.length
    && timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  if (role !== 'admin' || !validSignature || Number(expiresRaw) <= Date.now()) {
    throw createError({ statusCode: 401, statusMessage: '관리자 로그인이 필요합니다.' })
  }
}

// Non-throwing variant for public endpoints that only need to know whether the
// requester holds a valid admin session.
export function isAdmin(event: H3Event) {
  try {
    requireAdmin(event)
    return true
  } catch {
    return false
  }
}

export function setAdminSite(event: H3Event, siteId: string) {
  setCookie(event, SITE_COOKIE, siteId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  })
}

export async function requireAdminSite(event: H3Event) {
  requireAdmin(event)
  const db = await useDb()
  const selected = getCookie(event, SITE_COOKIE)
  let site = selected
    ? await db.collection('sites').findOne({ siteId: selected, isDeleted: { $ne: true } })
    : null
  if (!site) {
    site = await db.collection('sites').findOne({ isDeleted: { $ne: true } }, { sort: { name: 1 } })
    if (site) setAdminSite(event, site.siteId)
  }
  if (!site) throw createError({ statusCode: 409, statusMessage: '먼저 사이트를 생성하세요.' })
  event.context.adminSite = site
  return site
}

export function parseObjectId(value: unknown, label = 'id') {
  if (typeof value !== 'string' || !ObjectId.isValid(value)) {
    throw createError({ statusCode: 400, statusMessage: `${label}가 올바르지 않습니다.` })
  }
  return new ObjectId(value)
}
