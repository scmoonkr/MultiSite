import { resolvePublicSite } from '../../../utils/site'
import { useDb } from '../../../utils/mongo'
import { resolvePublicMenu } from '../../../utils/menus'

export default defineEventHandler(async (event) => {
  const site = await resolvePublicSite(event)
  const location = String(getRouterParam(event, 'location') || 'header')
  return { menu: await resolvePublicMenu(await useDb(), site.siteId, location) }
})
