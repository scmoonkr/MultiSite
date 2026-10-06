<template>
  <div class="theme-default"><DefaultThemeTopbar :items="navItems" /><main class="theme-page-body"><section class="theme-category-shell"><div class="theme-eyebrow">03 · Categories</div><h1>Browse <span class="theme-em">Topics.</span></h1><p class="theme-lede">주제별로 게시물을 탐색합니다.</p><div class="theme-category-grid"><NuxtLink v-for="item in items" :key="item.id" class="theme-category-card" :to="`/categories/${item.slug}`"><div class="theme-category-card-image"></div><div class="theme-category-card-body"><span class="theme-meta">{{ String(item.postCount || 0).padStart(2, '0') }} POSTS</span><h2>{{ item.name }}</h2><p>{{ item.description }}</p><span class="theme-link-arrow">Explore →</span></div></NuxtLink><div v-if="!items.length" class="theme-backend-state">등록된 카테고리가 없습니다.</div></div></section></main><DefaultThemeFooter :columns="footerColumns" :imprint="footerImprint" /></div>
</template>
<script setup lang="ts">
import type { CategorySummary } from '../../../shared/types'
import DefaultThemeTopbar from '../../components/public/DefaultThemeTopbar.vue'; import DefaultThemeFooter from '../../components/public/DefaultThemeFooter.vue'
const navItems = useSiteNav('header'); const footerColumns = useSiteFooterColumns(); const siteName = useSiteName()
const { data } = await useFetch<{ items: CategorySummary[] }>('/api/public/categories')
const items = computed(() => data.value?.items || []); const footerImprint = computed(() => `© 2026 ${siteName.value} · MultiSite CMS`)
useHead({ title: 'Categories' })
</script>
