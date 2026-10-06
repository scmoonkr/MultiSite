<template>
  <div class="theme-default">
    <DefaultThemeTopbar :items="navItems" />
    <DefaultThemeHero eyebrow="MULTISITE / HOME" corner="01" title="The" emphasis="Interface." lede="콘텐츠와 사이트를 하나의 일관된 경험으로 연결합니다." foot-left="MULTISITE CMS" foot-center="CONTENT SYSTEM" foot-right="SEOUL / KR" />
    <main class="theme-page-body">
      <section class="theme-block">
        <div class="theme-block-head"><h2 class="theme-block-title">Latest <span class="theme-em">Posts.</span></h2><NuxtLink class="theme-link-arrow" to="/posts">전체 보기 →</NuxtLink></div>
        <DefaultThemeTable :columns="tableColumns" :rows="rows" />
        <div v-if="!rows.length" class="theme-backend-state">등록된 게시물이 없습니다.</div>
      </section>
    </main>
    <DefaultThemeFooter :columns="footerColumns" :imprint="footerImprint" />
  </div>
</template>
<script setup lang="ts">
import type { ContentSummary } from '../../shared/types'
import DefaultThemeTopbar from '../components/public/DefaultThemeTopbar.vue'
import DefaultThemeHero from '../components/public/DefaultThemeHero.vue'
import DefaultThemeTable from '../components/public/DefaultThemeTable.vue'
import DefaultThemeFooter from '../components/public/DefaultThemeFooter.vue'
const navItems = useSiteNav('header')
const footerColumns = useSiteFooterColumns()
const siteName = useSiteName()
const { data } = await useFetch<{ items: ContentSummary[] }>('/api/public/contents', { query: { type: 'post', limit: 6 } })
const tableColumns = [{ key: 'rank', label: '#' }, { key: 'name', label: 'TITLE' }, { key: 'meta', label: 'TYPE' }, { key: 'date', label: 'DATE' }, { key: 'value', label: 'STATUS' }]
const rows = computed(() => (data.value?.items || []).map((item, index) => ({ rank: String(index + 1).padStart(2, '0'), name: item.title, meta: 'POST', date: formatDate(item.publishedAt || item.updatedAt), value: item.status.toUpperCase() })))
const footerImprint = computed(() => `© 2026 ${siteName.value} · MultiSite CMS`)
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value)) : '' }
</script>
