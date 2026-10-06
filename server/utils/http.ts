import type { H3Event } from 'h3'

export function cleanHost(value: string | undefined) {
  const first = (String(value || '').split(',')[0] || '').trim().toLowerCase()
  return first.replace(/^https?:\/\//, '').replace(/:\d+$/, '').replace(/\.$/, '')
}

export function requestHost(event: H3Event) {
  return cleanHost(getHeader(event, 'x-forwarded-host') || getHeader(event, 'host'))
}

export function objectIdString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function slugify(value: unknown) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)
}
