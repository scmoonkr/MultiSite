import { ObjectId, type Db } from 'mongodb'
import { slugify } from './http'

export function serializeCategory(row: any) {
  return {
    id: String(row._id),
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    parentId: row.parentId ? String(row.parentId) : null,
    order: row.order || 0,
    updatedAt: row.updatedAt?.toISOString?.() || row.updatedAt || null,
  }
}

export function validateCategoryName(input: unknown) {
  const name = typeof input === 'string' ? input.trim() : ''
  if (!name || name.length > 60) throw createError({ statusCode: 400, message: '이름은 1~60자여야 합니다.' })
  return name
}

// The {siteId, slug} index is unique across deleted rows too, so the lookup
// deliberately ignores isDeleted.
export async function uniqueCategorySlug(db: Db, siteId: string, desired: unknown, name: unknown, excludeId?: ObjectId) {
  const base = slugify(desired) || slugify(name) || 'category'
  let candidate = base
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const query: any = { siteId, slug: candidate }
    if (excludeId) query._id = { $ne: excludeId }
    if (!await db.collection('categories').findOne(query, { projection: { _id: 1 } })) return candidate
    candidate = `${base}-${suffix}`
  }
  throw createError({ statusCode: 409, message: '사용 가능한 slug를 만들 수 없습니다.' })
}

// Returns the parent id as a string, after checking it exists in this site and
// that linking it would not make `selfId` its own ancestor.
export async function resolveCategoryParent(db: Db, siteId: string, parentId: unknown, selfId?: string) {
  if (!parentId) return null
  const id = String(parentId)
  if (!ObjectId.isValid(id)) throw createError({ statusCode: 400, message: '상위 카테고리 id가 올바르지 않습니다.' })
  if (id === selfId) throw createError({ statusCode: 400, message: '자기 자신을 상위 카테고리로 지정할 수 없습니다.' })
  const find = (value: string) => db.collection('categories').findOne({ _id: new ObjectId(value), siteId, isDeleted: { $ne: true } })
  let cursor = await find(id)
  if (!cursor) throw createError({ statusCode: 400, message: '상위 카테고리를 찾을 수 없습니다.' })
  for (let depth = 0; cursor?.parentId && depth < 50; depth += 1) {
    if (String(cursor.parentId) === selfId) throw createError({ statusCode: 400, message: '하위 카테고리를 상위로 지정할 수 없습니다.' })
    cursor = await find(String(cursor.parentId))
  }
  return id
}
