import { ObjectId, type Db } from 'mongodb'

export function serializeMedia(doc: any) {
  if (!doc) return null
  const { _id, siteId: _siteId, ...rest } = doc
  return { id: String(_id), ...rest }
}

// Look up media docs by IDs within one site. Returns map id → media.
// Missing IDs / soft-deleted items / other sites' media are simply omitted.
export async function getMediaByIds(db: Db, siteId: string, ids: unknown[]) {
  const objectIds = [...new Set(ids.map(String))].filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id))
  const map: Record<string, any> = {}
  if (!objectIds.length) return map
  const docs = await db.collection('media').find({ _id: { $in: objectIds }, siteId, isDeleted: { $ne: true } }).toArray()
  for (const doc of docs) map[String(doc._id)] = serializeMedia(doc)
  return map
}

export function uploadRoot() {
  return String(useRuntimeConfig().uploadDir || 'uploads')
}
