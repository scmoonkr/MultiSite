<template>
  <div class="theme-backend">
    <DefaultThemeTopbar
      :items="navItems"
      full-width
      backend-mode
      backend-menu-button
      hide-nav
      toolbar-title="Tags."
      @backend-menu-toggle="isSidebarOpen = !isSidebarOpen"
    />
    <div v-if="isSidebarOpen" class="theme-backend-menu-backdrop" @click="isSidebarOpen = false"></div>

    <div class="theme-backend-shell">
      <BackendSidebar :open="isSidebarOpen" current-key="tags" @close="isSidebarOpen = false" />

      <main class="theme-backend-main">
        <div class="theme-backend-head theme-backend-contents-head">
          <h1>Tags.</h1>
          <div class="theme-backend-head-right">
            <span class="theme-meta">{{ items.length }} tags</span>
          </div>
        </div>

        <div v-if="pending" class="theme-backend-state">Loading tags...</div>

        <section v-else-if="!items.length" class="theme-backend-state">
          등록된 태그가 없습니다. 태그는 글을 저장할 때 자동으로 생성됩니다.
        </section>

        <section v-else class="theme-backend-table-wrap">
          <table class="theme-backend-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Posts</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td><strong>{{ item.name }}</strong></td>
                <td><code class="theme-backend-content-slug">{{ item.slug }}</code></td>
                <td class="theme-meta">{{ item.postCount || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import DefaultThemeTopbar from '~/components/public/DefaultThemeTopbar.vue'
import BackendSidebar from '~/components/admin/BackendSidebar.vue'
import type { TagSummary } from '../../../shared/types'

definePageMeta({ layout: 'default' })

const { navItems } = useBackendMenu()
const apiBase = useApiBase()

const isSidebarOpen = ref(false)

const { data, pending } = useFetch<{ items: TagSummary[] }>(
  `${apiBase}/api/admin/tags`,
  {
    key: 'admin-tags',
    credentials: 'include',
    server: false,
    default: () => ({ items: [] }),
  },
)

const items = computed<TagSummary[]>(() => data.value?.items ?? [])

useHead({ title: 'Tags · Backend' })
</script>
