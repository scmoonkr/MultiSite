<template>
  <div class="theme-backend">
    <DefaultThemeTopbar
      :items="navItems"
      full-width
      backend-mode
      backend-menu-button
      hide-nav
      toolbar-title="Sites."
      @backend-menu-toggle="isSidebarOpen = !isSidebarOpen"
    />
    <div v-if="isSidebarOpen" class="theme-backend-menu-backdrop" @click="isSidebarOpen = false"></div>

    <div class="theme-backend-shell">
      <BackendSidebar :open="isSidebarOpen" current-key="sites" @close="isSidebarOpen = false" />

      <main class="theme-backend-main">
        <div class="theme-backend-head theme-backend-contents-head">
          <h1>Sites.</h1>
          <div class="theme-backend-head-right">
            <span class="theme-meta">{{ siteList.length }} sites</span>
            <button type="button" class="theme-form-submit" @click="openNew">+ New Site</button>
          </div>
        </div>

        <div v-if="pending" class="theme-backend-state">Loading sites...</div>

        <section v-else-if="!siteList.length" class="theme-backend-state">
          등록된 사이트가 없습니다.
        </section>

        <section v-else class="theme-backend-table-wrap">
          <table class="theme-backend-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Site ID</th>
                <th>Domain</th>
                <th>Status</th>
                <th>Features</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="site in siteList"
                :key="site.siteId"
                :class="{ current: drawerOpen && editingId === site.id }"
                @click="openEdit(site)"
              >
                <td>
                  <strong>{{ site.name }}</strong>
                  <div v-if="site.description" class="theme-meta">{{ site.description }}</div>
                </td>
                <td><code class="theme-backend-content-slug">{{ site.siteId }}</code></td>
                <td><code class="theme-backend-content-slug">{{ site.primaryDomain }}</code></td>
                <td><span :class="['theme-backend-badge', `badge-status-${site.status === 'active' ? 'published' : 'draft'}`]">{{ site.status }}</span></td>
                <td class="theme-meta">{{ site.enabledFeatures.join(', ') || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>

    <!-- ── Drawer ── -->
    <div v-if="drawerOpen" class="theme-backend-user-modal" @click="drawerOpen = false">
      <div class="theme-backend-user-drawer theme-backend-compact-drawer" @click.stop>
        <div class="theme-backend-user-drawer-head">
          <strong>{{ isNewMode ? 'New Site' : form.name || 'Site' }}</strong>
          <button type="button" class="theme-backend-close" aria-label="Close" @click="drawerOpen = false">×</button>
        </div>

        <form class="theme-backend-form" @submit.prevent="save">
          <div class="theme-backend-form-grid">
            <label class="theme-form-field">
              <span>Site ID</span>
              <input
                v-model="form.siteId"
                required
                maxlength="60"
                placeholder="readfit"
                :readonly="!isNewMode"
                :title="isNewMode ? '' : '저장된 Site ID — 변경 불가'"
              />
            </label>

            <label class="theme-form-field">
              <span>Name</span>
              <input v-model="form.name" required maxlength="80" placeholder="사이트명" />
            </label>

            <label class="theme-form-field">
              <span>Primary domain</span>
              <input v-model="form.primaryDomain" required placeholder="readfit.localhost" />
            </label>

            <label class="theme-form-field">
              <span>Domains</span>
              <input v-model="form.domainsInput" placeholder="콤마로 구분 (예: readfit.localhost, localhost)" />
            </label>

            <label class="theme-form-field">
              <span>Status</span>
              <select v-model="form.status">
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>

            <label class="theme-form-field">
              <span>Description</span>
              <textarea v-model="form.description" rows="3"></textarea>
            </label>

            <label class="theme-form-field">
              <span>Features</span>
              <label class="theme-backend-posts-check">
                <input v-model="form.readingCheck" type="checkbox" />
                <span>독서 진단 (reading-check)</span>
              </label>
            </label>
          </div>

          <p v-if="message" :class="['theme-form-status', { error: isError }]">{{ message }}</p>

          <div class="theme-backend-actions site-drawer-actions">
            <button
              v-if="!isNewMode"
              type="button"
              class="theme-form-submit theme-form-submit-warning"
              :disabled="isSaving || isDeleting"
              @click="remove"
            >
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
            <span class="site-drawer-actions-right">
              <button
                type="button"
                class="theme-form-submit theme-form-submit-secondary-soft"
                :disabled="isSaving || isDeleting"
                @click="clear"
              >
                Clear
              </button>
              <button class="theme-form-submit" type="submit" :disabled="isSaving || isDeleting">
                {{ isSaving ? 'Saving...' : 'Save' }}
              </button>
            </span>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DefaultThemeTopbar from '~/components/public/DefaultThemeTopbar.vue'
import BackendSidebar from '~/components/admin/BackendSidebar.vue'
import type { SiteSummary } from '../../../shared/types'

definePageMeta({ layout: 'default' })

const { navItems } = useBackendMenu()
const apiBase = useApiBase()

const isSidebarOpen = ref(false)
const drawerOpen = ref(false)
const isNewMode = ref(true)
const editingId = ref('')
const isSaving = ref(false)
const isDeleting = ref(false)
const message = ref('')
const isError = ref(false)

const form = reactive({
  siteId: '',
  name: '',
  primaryDomain: '',
  domainsInput: '',
  status: 'active',
  description: '',
  readingCheck: false,
})

const { data, pending, refresh } = useFetch<{ items: SiteSummary[] }>(
  `${apiBase}/api/admin/sites`,
  {
    key: 'admin-sites-list',
    credentials: 'include',
    server: false,
    default: () => ({ items: [] }),
  },
)

const siteList = computed<SiteSummary[]>(() => data.value?.items ?? [])

// Clear empties the form and switches the drawer to "new site" mode.
function clear() {
  isNewMode.value = true
  editingId.value = ''
  Object.assign(form, { siteId: '', name: '', primaryDomain: '', domainsInput: '', status: 'active', description: '', readingCheck: false })
  message.value = ''
  isError.value = false
}

function openNew() {
  clear()
  drawerOpen.value = true
}

function openEdit(site: SiteSummary) {
  isNewMode.value = false
  editingId.value = site.id
  Object.assign(form, {
    siteId: site.siteId,
    name: site.name,
    primaryDomain: site.primaryDomain,
    domainsInput: site.domains.filter(domain => domain !== site.primaryDomain).join(', '),
    status: site.status,
    description: site.description,
    readingCheck: site.enabledFeatures.includes('reading-check'),
  })
  message.value = ''
  isError.value = false
  drawerOpen.value = true
}

function errorMessage(err: unknown, fallback: string) {
  const e = err as { data?: { message?: string; statusMessage?: string }, message?: string }
  return e?.data?.message || e?.data?.statusMessage || e?.message || fallback
}

async function save() {
  message.value = ''
  isError.value = false
  isSaving.value = true
  try {
    const current = siteList.value.find(site => site.id === editingId.value)
    // Features this form does not manage are kept as they are.
    const otherFeatures = (current?.enabledFeatures || []).filter(key => key !== 'reading-check')
    const extraDomains = form.domainsInput.split(',').map(domain => domain.trim()).filter(Boolean)
    const body = {
      siteId: form.siteId,
      name: form.name,
      primaryDomain: form.primaryDomain,
      description: form.description,
      status: form.status,
      domains: [...new Set([form.primaryDomain, ...extraDomains])],
      enabledFeatures: form.readingCheck ? [...otherFeatures, 'reading-check'] : otherFeatures,
      theme: current?.theme,
    }
    if (isNewMode.value) {
      const result = await $fetch<{ site: SiteSummary }>(`${apiBase}/api/admin/sites`, { method: 'POST', credentials: 'include', body })
      await refresh()
      openEdit(result.site)
      message.value = '사이트가 생성되었습니다.'
    } else {
      const result = await $fetch<{ site: SiteSummary }>(`${apiBase}/api/admin/sites/${editingId.value}`, { method: 'PUT', credentials: 'include', body })
      await refresh()
      openEdit(result.site)
      message.value = '저장되었습니다.'
    }
    setTimeout(() => { message.value = '' }, 2200)
  } catch (err: unknown) {
    isError.value = true
    message.value = errorMessage(err, '저장에 실패했습니다.')
  } finally {
    isSaving.value = false
  }
}

async function remove() {
  if (!editingId.value || isDeleting.value) return
  if (!window.confirm(`'${form.name}' 사이트를 삭제할까요?
사이트 등록만 삭제되며, 글·페이지·카테고리 등 데이터는 DB에 남습니다.`)) return
  message.value = ''
  isError.value = false
  isDeleting.value = true
  try {
    await $fetch(`${apiBase}/api/admin/sites/${editingId.value}`, { method: 'DELETE', credentials: 'include' })
    // The topbar switcher and the working-site cookie may point at the removed site.
    window.location.reload()
  } catch (err: unknown) {
    isError.value = true
    message.value = errorMessage(err, '삭제에 실패했습니다.')
    isDeleting.value = false
  }
}

useHead({ title: 'Sites · Backend' })
</script>

<style scoped>
.theme-backend-table tbody tr {
  cursor: pointer;
}

.site-drawer-actions {
  justify-content: space-between;
}

/* Three default-width (150px) buttons overflow the 420px drawer's right edge. */
.site-drawer-actions .theme-form-submit {
  min-width: 88px;
  padding: 0 14px;
}

.site-drawer-actions-right {
  display: flex;
  gap: 10px;
  margin-left: auto;
}
</style>
