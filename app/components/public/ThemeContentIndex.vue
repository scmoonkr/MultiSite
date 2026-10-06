<template>
  <div class="theme-default">
    <DefaultThemeTopbar :items="navItems" />
    <section class="theme-stub"><div class="theme-eyebrow">{{ eyebrow }}</div><h1>{{ title }} <span class="theme-em">{{ emphasis }}</span></h1><p class="theme-lede">{{ description }}</p></section>
    <main class="theme-page-body"><section class="theme-block"><div class="theme-block-head"><h2 class="theme-block-title">{{ heading }} <span class="theme-em">Records.</span></h2><span class="theme-meta">{{ items.length }} entries · published</span></div><div class="theme-content-grid"><NuxtLink v-for="item in items" :key="item.id" class="theme-content-tile" :to="`/${item.contentType}/${item.slug}`"><span class="theme-meta">{{ item.contentType.toUpperCase() }}</span><h3>{{ item.title }}</h3><p>{{ item.summary }}</p><small>{{ formatDate(item.publishedAt || item.updatedAt) }}</small></NuxtLink><div v-if="!items.length" class="theme-backend-state">등록된 콘텐츠가 없습니다.</div></div></section></main>
    <DefaultThemeFooter :columns="footerColumns" :imprint="footerImprint" />
  </div>
</template>
<script setup lang="ts">
import DefaultThemeTopbar from './DefaultThemeTopbar.vue'
import DefaultThemeFooter from './DefaultThemeFooter.vue'
import type { ContentSummary } from '../../../shared/types'
const props = defineProps<{ items: ContentSummary[], eyebrow: string, title: string, emphasis: string, heading: string, description: string }>()
const navItems = useSiteNav('header'); const footerColumns = useSiteFooterColumns(); const siteName = useSiteName(); const footerImprint = computed(() => `© 2026 ${siteName.value} · Template controlled · StyleFamily based`)
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value)) : '' }
</script>
