import type { PublicMenuItem } from './useSite'

export type NavItem = {
  label: string
  to: string
  target?: 'self' | 'blank'
  current?: boolean
  /** Empty URL means this is a non-clickable section header (대표메뉴). */
  isHeader?: boolean
  children?: NavItem[]
}

function toNav(item: PublicMenuItem): NavItem {
  return {
    label: item.title,
    to: item.url || '#',
    target: item.target,
    isHeader: !item.url,
    children: (item.children || []).map(toNav),
  }
}

// Menus arrive already resolved to URLs with the site payload (see useSite),
// so header and footer need no extra request.
export function useSiteNav(location: 'header' | 'footer' | 'sidebar' = 'header') {
  const { data } = useSite()
  return computed<NavItem[]>(() => {
    const items = location === 'header' ? data.value?.menu : location === 'footer' ? data.value?.footerMenu : []
    return (items || []).map(toNav)
  })
}

// For a footer rendered as columns: top-level menu items become column headers,
// their children become link lists under that column.
// When the footer menu is flat (no children, no section headers — e.g., copied
// from the main header menu), collapse everything into a single row of links
// so the footer reads as a horizontal nav strip rather than empty column titles.
export type FooterColumn = {
  title: string
  /** When set, the column header is rendered as a link (NuxtLink). */
  titleTo?: string
  titleTarget?: 'self' | 'blank'
  body?: string
  links?: Array<{ label: string; to: string; target?: 'self' | 'blank' }>
  /** 'row' lays the column's links out horizontally; default is column. */
  layout?: 'row' | 'column'
}

export function useSiteFooterColumns() {
  const nav = useSiteNav('footer')
  return computed<FooterColumn[]>(() => {
    const items = nav.value
    // No footer menu configured for this site: keep the built-in column.
    if (!items.length) {
      return [{
        title: 'MultiSite CMS',
        body: 'Content, Blocks, and Features are managed within a shared site system.',
      }]
    }

    const isFlat = items.every(it => !it.isHeader && !(it.children && it.children.length))
    if (isFlat) {
      return [{
        title: '',
        layout: 'row',
        links: items.map(it => ({ label: it.label, to: it.to, target: it.target })),
      }]
    }

    // Column mode: each top-level item becomes a column. When the item has a URL
    // (not a 대표메뉴/header-only entry) we expose it via titleTo so the renderer
    // can wrap the heading in a clickable link.
    return items.map(item => ({
      title: item.label,
      titleTo: item.isHeader ? undefined : item.to,
      titleTarget: item.target,
      links: (item.children || []).map(c => ({
        label: c.label,
        to: c.to,
        target: c.target,
      })),
    }))
  })
}
