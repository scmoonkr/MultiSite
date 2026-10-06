export type SiteStatus = 'active' | 'disabled' | 'maintenance'
export type ContentType = 'post' | 'page'
export type ContentStatus = 'draft' | 'published' | 'hidden' | 'deleted'
export type AccessLevel = 'public' | 'member' | 'employee' | 'manager' | 'admin'

export interface BlockNode {
  type: string
  props: Record<string, any>
}

export interface SiteTheme {
  primary: string
  accent: string
  background: string
  text: string
}

export interface SiteSummary {
  id: string
  siteId: string
  name: string
  description: string
  primaryDomain: string
  domains: string[]
  status: SiteStatus
  enabledFeatures: string[]
  theme: SiteTheme
}

export interface ContentSummary {
  id: string
  contentType: ContentType
  title: string
  slug: string
  summary: string
  status: ContentStatus
  accessLevel: AccessLevel
  categoryIds: string[]
  thumbnailImageId: string | null
  tagIds?: string[]
  meta?: Record<string, unknown>
  publishedAt: string | null
  updatedAt: string
}

export interface ContentDetail extends ContentSummary {
  markdown: string
  blocks: BlockNode[]
  template: string | null
  meta: Record<string, unknown>
}

export interface CategorySummary {
  id: string
  name: string
  slug: string
  description: string
  parentId?: string | null
  order: number
  updatedAt?: string | null
  postCount?: number
}

export interface TagSummary {
  id: string
  name: string
  slug: string
  postCount?: number
}
