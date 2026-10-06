import { resolvePublicSite, serializeSite } from '../../utils/site'
import { useDb } from '../../utils/mongo'
import { resolvePublicMenu } from '../../utils/menus'

export default defineEventHandler(async (event) => {
  const site = await resolvePublicSite(event)
  const db = await useDb()
  const [header, footer] = await Promise.all([
    resolvePublicMenu(db, site.siteId, 'header'),
    resolvePublicMenu(db, site.siteId, 'footer'),
  ])
  return { site: serializeSite(site), menu: header?.items || [], footerMenu: footer?.items || [] }
})
