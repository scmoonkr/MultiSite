<template>
  <div class="theme-default"><DefaultThemeTopbar :items="navItems" /><main class="theme-page-body"><section class="theme-category-shell"><div class="theme-eyebrow">TAG / {{ tag?.name }}</div><h1>{{ tag?.name }}</h1><p class="theme-lede">이 태그가 붙은 게시물입니다.</p><div class="theme-category-grid"><NuxtLink v-for="item in items" :key="item.id" class="theme-category-card" :to="`/${item.contentType}/${item.slug}`"><div class="theme-category-card-image"></div><div class="theme-category-card-body"><span class="theme-meta">{{ item.contentType.toUpperCase() }}</span><h2>{{ item.title }}</h2><p>{{ item.summary }}</p><time>{{ formatDate(item.publishedAt || item.updatedAt) }}</time></div></NuxtLink><div v-if="!items.length" class="theme-backend-state">이 태그의 게시물이 없습니다.</div></div></section></main><DefaultThemeFooter :columns="footerColumns" :imprint="footerImprint" /></div>
</template>
<script setup lang="ts">
import type { ContentSummary, TagSummary } from '../../../shared/types'
import DefaultThemeTopbar from '../../components/public/DefaultThemeTopbar.vue'; import DefaultThemeFooter from '../../components/public/DefaultThemeFooter.vue'
const route = useRoute(); const navItems = useSiteNav('header'); const footerColumns = useSiteFooterColumns(); const siteName = useSiteName()
const { data } = await useFetch<{ tag: TagSummary, items: ContentSummary[] }>(() => `/api/public/tags/${route.params.slug}`)
const tag = computed(() => data.value?.tag); const items = computed(() => data.value?.items || []); const footerImprint = computed(() => `© 2026 ${siteName.value} · MultiSite CMS`)
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value)) : '' }
</script>
