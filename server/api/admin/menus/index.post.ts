import { requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { MENU_LOCATIONS, menuWriteError, sanitizeMenuItems, serializeMenu } from '../../../utils/menus'

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const body = await readBody<any>(event)
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 100) : ''
  if (!name) throw createError({ statusCode: 400, message: '메뉴 이름을 입력하세요.' })
  const now = new Date()
  const doc = {
    siteId: site.siteId,
    name,
    location: MENU_LOCATIONS.includes(body.location) ? body.location : 'custom',
    items: sanitizeMenuItems(body.items),
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  }
  const db = await useDb()
  try {
    const result = await db.collection('menus').insertOne(doc)
    setResponseStatus(event, 201)
    return { menu: serializeMenu({ ...doc, _id: result.insertedId }) }
  } catch (error) {
    throw menuWriteError(error)
  }
})
