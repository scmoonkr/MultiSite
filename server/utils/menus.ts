import { ObjectId, type Db } from 'mongodb'
import { publicContentFilter } from './content'

const ITEM_TYPES = ['page', 'post', 'category', 'url']
export const MENU_LOCATIONS = ['header', 'footer', 'sidebar', 'custom']
const MAX_DEPTH = 2

// Items saved by the earlier flat menu editor addressed their target by slug or
// feature key. They are read as plain links so they keep working until re-saved.
function legacyUrl(item: any) {
  if (item.type === 'feature') return `/${item.featureKey || item.url || ''}`
  if (item.type === 'page' && !item.contentId && item.slug) return `/page/${item.slug}`
  if (item.type === 'category' && !item.categoryId && item.slug) return `/categories/${item.slug}`
  return null
}

// Normalize a menu item tree. Drops invalid items and limits nesting to MAX_DEPTH.
export function sanitizeMenuItems(items: unknown, depth = 0): any[] {
  if (!Array.isArray(items) || depth >= MAX_DEPTH) return []
  const out: any[] = []
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue
    const legacy = legacyUrl(raw)
    const type = legacy ? 'url' : raw.type
    if (!ITEM_TYPES.includes(type)) continue
    const item: any = {
      id: typeof raw.id === 'string' && raw.id ? raw.id : String(new ObjectId()),
      title: String(raw.title || '').slice(0, 200).trim(),
      type,
      target: raw.target === 'blank' ? 'blank' : 'self',
      isVisible: raw.isVisible !== false,
      order: out.length,
    }
    if (type === 'page' || type === 'post') item.contentId = raw.contentId ? String(raw.contentId) : null
    else if (type === 'category') item.categoryId = raw.categoryId ? String(raw.categoryId) : null
    else item.url = String(legacy ?? raw.url ?? '').slice(0, 500)
    item.children = sanitizeMenuItems(raw.children, depth + 1)
    out.push(item)
  }
  return out
}

export function serializeMenu(doc: any) {
  return {
    id: String(doc._id),
    name: doc.name || doc.location,
    location: doc.location,
    items: sanitizeMenuItems(doc.items),
  }
}

// Each site holds one menu per location (unique index), which is also what the
// public resolver assumes.
export function menuWriteError(error: any) {
  if (error?.code === 11000) return createError({ statusCode: 409, message: '이 위치에는 이미 메뉴가 있습니다. 기존 메뉴를 수정하거나 다른 위치를 선택하세요.' })
  return error
}

// Resolve a site's menu for a location into a tree of { id, title, url, target,
// children }. Items whose page/post/category is gone or unpublished are dropped.
export async function resolvePublicMenu(db: Db, siteId: string, location: string) {
  const doc = await db.collection('menus').findOne({ siteId, location, isDeleted: { $ne: true } })
  if (!doc) return null
  const items = sanitizeMenuItems(doc.items)

  const contentIds = new Set<string>()
  const categoryIds = new Set<string>()
  const collect = (list: any[]) => {
    for (const item of list) {
      if (item.contentId && ObjectId.isValid(item.contentId)) contentIds.add(item.contentId)
      if (item.categoryId && ObjectId.isValid(item.categoryId)) categoryIds.add(item.categoryId)
      collect(item.children)
    }
  }
  collect(items)

  const toObjectIds = (ids: Set<string>) => [...ids].map(id => new ObjectId(id))
  const [contents, categories] = await Promise.all([
    contentIds.size
      ? db.collection('contents').find({ ...publicContentFilter(siteId, { anyAccess: true }), _id: { $in: toObjectIds(contentIds) } }, { projection: { slug: 1, contentType: 1 } }).toArray()
      : [],
    categoryIds.size
      ? db.collection('categories').find({ siteId, _id: { $in: toObjectIds(categoryIds) }, isDeleted: { $ne: true } }, { projection: { slug: 1 } }).toArray()
      : [],
  ])
  const contentById = new Map(contents.map(row => [String(row._id), row]))
  const categoryById = new Map(categories.map(row => [String(row._id), row]))

  const resolveTree = (list: any[]): any[] => list.flatMap((item) => {
    if (!item.isVisible) return []
    let url: string
    if (item.type === 'category') {
      const category = categoryById.get(item.categoryId)
      if (!category) return []
      url = `/categories/${category.slug}`
    } else if (item.type === 'url') {
      // An empty URL is allowed: it renders as a non-clickable section header.
      url = item.url || ''
    } else {
      const content = contentById.get(item.contentId)
      if (!content) return []
      url = `/${content.contentType}/${content.slug}`
    }
    return [{ id: item.id, title: item.title, url, target: item.target, children: resolveTree(item.children) }]
  })

  return { id: String(doc._id), name: doc.name || location, location, items: resolveTree(items) }
}
