export function useSiteConfig() {
  const { data } = useSite()
  return computed(() => ({ siteName: data.value?.site.name || '', logoUrl: '', faviconUrl: '', theme: 'default' }))
}
