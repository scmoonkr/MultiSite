<template>
  <div class="block-site-content">
    <BlockRenderer
      v-if="blocks.length"
      :blocks="blocks"
      :media-map="block.props.mediaMap || {}"
    />
    <!-- 원본이 없거나 비공개면 공개 화면에서는 아무것도 그리지 않고,
         편집기 미리보기에서만 이유를 알려준다 (서버가 previewNote를 채운 경우). -->
    <p v-else-if="block.props.previewNote" class="block-site-content-missing">{{ block.props.previewNote }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BlockRenderer from './BlockRenderer.vue'

type BlockNode = { type: string; props: Record<string, unknown> }
type MediaInfo = { paths?: { original?: string }; title?: string; alt?: string }

// siteId/slug are what the author wrote; blocks/mediaMap are filled in by the
// server from the source content each time the page is read.
const props = defineProps<{
  block: {
    props: {
      siteId?: string
      slug?: string
      blocks?: BlockNode[]
      mediaMap?: Record<string, MediaInfo>
      previewNote?: string
    }
  }
}>()

const blocks = computed<BlockNode[]>(() => props.block.props.blocks || [])
</script>

<style scoped>
/* The embedded renderer sits inside the host article's renderer, which already
   provides the side padding. */
/* Doubled class: must outrank the host page's own `:deep(.block-renderer)` padding. */
.block-site-content.block-site-content :deep(.block-renderer) {
  padding: 0;
}

.block-site-content-missing {
  margin: 0;
  padding: 14px 16px;
  border: 1px dashed var(--theme-line);
  color: var(--theme-fg-dim);
  font-size: 13px;
}
</style>
