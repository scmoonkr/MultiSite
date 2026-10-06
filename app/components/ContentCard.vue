<template>
  <article class="content-card">
    <div class="card-meta"><span>{{ item.contentType === 'post' ? 'POST' : 'PAGE' }}</span><time>{{ formatDate(item.publishedAt || item.updatedAt) }}</time></div>
    <h2><NuxtLink :to="`/${item.contentType}/${item.slug}`">{{ item.title }}</NuxtLink></h2>
    <p>{{ item.summary || '요약이 아직 작성되지 않았습니다.' }}</p>
    <NuxtLink class="text-link" :to="`/${item.contentType}/${item.slug}`">계속 읽기 →</NuxtLink>
  </article>
</template>
<script setup lang="ts">
import type { ContentSummary } from '../../shared/types'
defineProps<{ item: ContentSummary }>()
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value)) : '' }
</script>
