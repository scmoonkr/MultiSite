import { clearAdminSession } from '../../../utils/admin'

export default defineEventHandler((event) => {
  clearAdminSession(event)
  return { ok: true }
})
