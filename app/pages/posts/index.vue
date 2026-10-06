<template><ThemeContentIndex eyebrow="01 · The Posts" title="The" emphasis="Posts." heading="Published" description="사이트에 공개된 게시물을 한 곳에서 확인합니다." :items="data?.items || []" /></template>
<script setup lang="ts">
import type { ContentSummary } from '../../../shared/types'
const { data } = await useFetch<{ items: ContentSummary[] }>('/api/public/contents', { query: { type: 'post', limit: 50 } })
useHead({ title: 'Posts' })
</script>
