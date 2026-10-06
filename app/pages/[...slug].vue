<template><component :is="feature.component" v-if="feature && enabled" /><section v-else class="not-found"><p class="eyebrow">404</p><h1>페이지를 찾을 수 없습니다.</h1><p>이 사이트에서 활성화되지 않았거나 존재하지 않는 기능입니다.</p></section></template>
<script setup lang="ts">
import { featureByPath } from '../features/registry'
const route = useRoute()
const { data } = await useSite()
const path = `/${Array.isArray(route.params.slug) ? route.params.slug.join('/') : route.params.slug}`
const feature = featureByPath(path)
const enabled = computed(() => !!feature && (data.value?.site.enabledFeatures || []).includes(feature.key))
if (!feature || !enabled.value) setResponseStatus(404)
useHead(() => ({ title: feature && enabled.value ? feature.name : '페이지 없음' }))
</script>
