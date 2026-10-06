import { parseObjectId, requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { MENU_LOCATIONS, menuWriteError, sanitizeMenuItems, serializeMenu } from '../../../utils/menus'

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const id = parseObjectId(getRouterParam(event, 'id'))
  const body = await readBody<any>(event)
  const update: any = { updatedAt: new Date() }
  if (typeof body?.name === 'string' && body.name.trim()) update.name = body.name.trim().slice(0, 100)
  if (MENU_LOCATIONS.includes(body?.location)) update.location = body.location
  if (Array.isArray(body?.items)) update.items = sanitizeMenuItems(body.items)
  const db = await useDb()
  try {
    const result = await db.collection('menus').findOneAndUpdate({ _id: id, siteId: site.siteId, isDeleted: { $ne: true } }, { $set: update }, { returnDocument: 'after' })
    if (!result) throw createError({ statusCode: 404, message: '메뉴를 찾을 수 없습니다.' })
    return { menu: serializeMenu(result) }
  } catch (error) {
    throw menuWriteError(error)
  }
})
