export function useSiteName() {
  const { data } = useSite()
  return computed(() => data.value?.site.name || 'MultiSite')
}
