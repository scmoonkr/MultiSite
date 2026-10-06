import type { SiteSummary } from '../../shared/types'

// Menu item as the public API returns it: already resolved to a URL.
// An empty url marks a non-clickable section header.
export interface PublicMenuItem {
  id: string
  title: string
  url: string
  target?: 'self' | 'blank'
  children?: PublicMenuItem[]
}

export function useSite() {
  return useAsyncData('public-site', () => $fetch<{ site: SiteSummary, menu: PublicMenuItem[], footerMenu: PublicMenuItem[] }>('/api/public/site'))
}

export function menuHref(item: PublicMenuItem) {
  return item.url || '#'
}
