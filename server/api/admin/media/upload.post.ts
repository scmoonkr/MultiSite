import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, extname, resolve } from 'node:path'
import { requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { serializeMedia, uploadRoot } from '../../../utils/media'

// The stored extension comes from the verified mime type, never from the
// client's filename, so an upload cannot be served back as another type.
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
}

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const parts = (await readMultipartFormData(event) || []).filter(part => part.filename && part.data.length)
  if (!parts.length) throw createError({ statusCode: 400, message: '업로드할 파일이 없습니다.' })

  const db = await useDb()
  const now = new Date()
  const yyyy = String(now.getFullYear())
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const items = []

  for (const part of parts) {
    const mimeType = String(part.type || '').split(';')[0]!.trim().toLowerCase()
    const ext = EXTENSIONS[mimeType]
    if (!ext) continue

    const originalName = basename(String(part.filename))
    const title = basename(originalName, extname(originalName))
    const hash = createHash('sha256').update(part.data).digest('hex')
    const safeBase = title.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-').slice(0, 48)
    const uid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const filename = `${uid}-${safeBase}${ext}`
    // uploads/<siteId>/<yyyy>/<mm>/<hash prefix>/<file> keeps each site's files apart.
    const segments = [site.siteId, yyyy, mm, hash.slice(0, 2)]
    const dir = resolve(uploadRoot(), ...segments)
    await mkdir(dir, { recursive: true })
    await writeFile(resolve(dir, filename), part.data)

    const doc = {
      siteId: site.siteId,
      title,
      originalName,
      filename,
      mimeType,
      size: part.data.length,
      hash,
      storage: 'local',
      paths: { original: `/uploads/${segments.join('/')}/${filename}` },
      alt: '',
      caption: '',
      description: '',
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    }
    const result = await db.collection('media').insertOne(doc)
    items.push(serializeMedia({ ...doc, _id: result.insertedId }))
  }

  if (!items.length) throw createError({ statusCode: 400, message: '이미지(jpg, png, gif, webp, svg) 또는 동영상(mp4, webm)만 업로드할 수 있습니다.' })
  return { items }
})
