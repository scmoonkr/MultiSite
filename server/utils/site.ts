import type { H3Event } from 'h3'
import type { SiteSummary } from '../../shared/types'
import { useDb } from './mongo'
import { requestHost } from './http'

export function serializeSite(site: any): SiteSummary {
  return {
    id: String(site._id),
    siteId: site.siteId,
    name: site.name,
    description: site.description || '',
    primaryDomain: site.primaryDomain || '',
    domains: (site.domains || []).map((item: any) => typeof item === 'string' ? item : item.host),
    status: site.status || 'active',
    enabledFeatures: site.enabledFeatures || [],
    theme: {
      primary: site.theme?.primary || '#10233f',
      accent: site.theme?.accent || '#b58b40',
      background: site.theme?.background || '#ffffff',
      text: site.theme?.text || '#151515',
    },
  }
}

export async function resolvePublicSite(event: H3Event) {
  const db = await useDb()
  const host = requestHost(event)
  let site = await db.collection('sites').findOne({
    status: { $in: ['active', 'maintenance'] },
    isDeleted: { $ne: true },
    $or: [
      { primaryDomain: host },
      { domains: host },
      { 'domains.host': host },
    ],
  })

  if (!site && ['localhost', '127.0.0.1', '::1'].includes(host)) {
    const config = useRuntimeConfig(event)
    site = await db.collection('sites').findOne({
      siteId: config.defaultSiteId,
      status: { $in: ['active', 'maintenance'] },
      isDeleted: { $ne: true },
    })
  }

  if (!site) throw createError({ statusCode: 404, statusMessage: '등록되지 않은 사이트입니다.' })
  if (site.status === 'maintenance') {
    setResponseStatus(event, 503)
  }
  event.context.site = site
  return site
}
