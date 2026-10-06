export function useSiteDescription() {
  const { data } = useSite()
  return computed(() => data.value?.site.description || '')
}
