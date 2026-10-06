export function useApiBase() {
  return String(useRuntimeConfig().public.apiBase || '')
}
