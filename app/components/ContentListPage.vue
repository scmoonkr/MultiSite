<template>
  <section class="page-section">
    <header class="page-heading">
      <p class="eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
    </header>
    <div v-if="items.length" class="card-grid">
      <ContentCard v-for="item in items" :key="item.id" :item="item" />
    </div>
    <div v-else class="empty-state">아직 공개된 콘텐츠가 없습니다.</div>
  </section>
</template>
<script setup lang="ts">
import type { ContentSummary } from '../../shared/types'
defineProps<{ eyebrow: string, title: string, description: string, items: ContentSummary[] }>()
</script>
