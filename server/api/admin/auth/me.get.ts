import { requireAdminSite } from '../../../utils/admin'
import { serializeSite } from '../../../utils/site'

export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  return { authenticated: true, site: serializeSite(site) }
})
