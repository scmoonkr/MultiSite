export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/backend') || to.path === '/backend/login') return
  try {
    await $fetch('/api/admin/auth/me', {
      headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
    })
  } catch {
    return navigateTo(`/backend/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
