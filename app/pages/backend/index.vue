<template>
  <section><div class="backend-heading"><div><p class="eyebrow">Overview</p><h1>{{ data?.site.name || '대시보드' }}</h1></div><a v-if="data" class="button" :href="`http://${data.site.primaryDomain}`" target="_blank">사이트 열기</a></div>
    <div class="metric-grid"><article v-for="(value, key) in data?.counts" :key="key"><small>{{ labels[key] }}</small><strong>{{ value }}</strong></article></div>
    <div class="backend-note"><h2>공통 Core, 사이트별 데이터</h2><p>글·페이지·카테고리·메뉴·설정은 현재 선택한 사이트의 <code>siteId</code> 범위에서만 조회되고 저장됩니다. 기능 페이지는 Feature Registry에서 코드로 관리합니다.</p></div>
  </section>
</template>
<script setup lang="ts">
import type { SiteSummary } from '../../../shared/types'
definePageMeta({ layout: 'backend' })
const { data } = await useFetch<{ site: SiteSummary, counts: Record<string, number> }>('/api/admin/dashboard')
const labels: Record<string, string> = { posts: '전체 글', pages: '전체 페이지', categories: '카테고리', drafts: '초안' }
</script>
