const ROLE_LEVELS: Record<string, number> = {
  public:   0,
  member:   1,
  employee: 2,
  manager:  3,
  admin:    4,
  super:    5,
}

type Role    = { role: string }
type MeUser  = { id: string; name?: string; roles?: Role[] } | null

export function useBlockAuth() {
  const apiBase = useApiBase()

  // 페이지 내 여러 블록이 각자 fetch하지 않도록 useState로 공유
  const user    = useState<MeUser>('block-auth-user',    () => null)
  const fetched = useState<boolean>('block-auth-fetched', () => false)
  const loading = useState<boolean>('block-auth-loading', () => false)

  // MultiSite에는 회원 계정이 없고 관리자 세션만 있으므로,
  // 로그인한 관리자를 admin 역할로 취급한다.
  async function fetchUser() {
    if (fetched.value || loading.value || import.meta.server) return
    loading.value = true
    try {
      await $fetch(`${apiBase}/api/admin/auth/me`, { credentials: 'include' })
      user.value = { id: 'admin', roles: [{ role: 'admin' }] }
    } catch {
      user.value = null
    } finally {
      fetched.value = true
      loading.value = false
    }
  }

  const isLoggedIn = computed(() => !!user.value)

  // 보유한 가장 높은 역할 레벨
  const userLevel = computed((): number => {
    if (!user.value?.roles?.length) return 0
    return Math.max(...user.value.roles.map(r => ROLE_LEVELS[r.role] ?? 0))
  })

  function hasAccess(required?: string): boolean {
    if (!required || required === 'public') return true
    const need = ROLE_LEVELS[required] ?? 0
    if (need === 0) return true
    return userLevel.value >= need
  }

  return { user, isLoggedIn, userLevel, hasAccess, fetchUser, fetched, loading }
}
