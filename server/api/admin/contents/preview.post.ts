import { requireAdminSite } from '../../../utils/admin'
import { useDb } from '../../../utils/mongo'
import { previewMarkdown } from '../../../utils/content'

// Parse + validate markdown without saving, so the editor can render a preview
// and list block errors before the author hits save.
export default defineEventHandler(async (event) => {
  const site = await requireAdminSite(event)
  const body = await readBody<{ markdown?: string }>(event)
  return previewMarkdown(await useDb(), site.siteId, String(body?.markdown || ''))
})
