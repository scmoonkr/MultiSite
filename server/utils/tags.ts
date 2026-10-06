import { slugify } from './http'

export async function resolveTagIds(db: any, siteId: string, input: unknown) {
  const names = Array.isArray(input) ? input.map(value => String(value).trim()).filter(Boolean) : []
  const ids: string[] = []
  for (const name of [...new Set(names)]) {
    const slug = slugify(name)
    if (!slug) continue
    const result = await db.collection('tags').findOneAndUpdate(
      { siteId, slug, isDeleted: { $ne: true } },
      // `name` lives only in $set: MongoDB rejects the same path in both operators.
      // siteId/slug come from the filter on insert.
      { $setOnInsert: { createdAt: new Date(), isDeleted: false }, $set: { name, updatedAt: new Date() } },
      { upsert: true, returnDocument: 'after' },
    )
    if (result?._id) ids.push(String(result._id))
  }
  return ids
}
