<template><ThemeContentIndex eyebrow="02 · The Pages" title="The" emphasis="Pages." heading="Reference" description="사이트의 소개와 주요 안내 페이지입니다." :items="data?.items || []" /></template>
<script setup lang="ts">
import type { ContentSummary } from '../../../shared/types'
const { data } = await useFetch<{ items: ContentSummary[] }>('/api/public/contents', { query: { type: 'page', limit: 50 } })
useHead({ title: 'Pages' })
</script>
