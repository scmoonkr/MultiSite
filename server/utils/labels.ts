import { ObjectId, type Db } from 'mongodb'

export interface LabelRef { id: string, name: string, slug: string }

// Resolve category/tag ids to { id, name, slug } within one site.
export async function getLabelsByIds(db: Db, collection: 'categories' | 'tags', siteId: string, ids: unknown[]): Promise<LabelRef[]> {
  const objectIds = [...new Set(ids.map(String))].filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id))
  if (!objectIds.length) return []
  const docs = await db.collection(collection)
    .find({ _id: { $in: objectIds }, siteId, isDeleted: { $ne: true } })
    .project({ name: 1, slug: 1 })
    .toArray()
  return docs.map(doc => ({ id: String(doc._id), name: doc.name, slug: doc.slug }))
}
