<template>
  <label class="site-switcher"><span>작업 사이트</span><select v-model="selected" @change="change"><option v-for="site in data?.items" :key="site.siteId" :value="site.siteId">{{ site.name }} · {{ site.siteId }}</option></select></label>
</template>
<script setup lang="ts">
import type { SiteSummary } from '../../../shared/types'
const emit = defineEmits<{ changed: [] }>()
const { data: me } = await useFetch<{ site: SiteSummary }>('/api/admin/auth/me')
const { data } = await useFetch<{ items: SiteSummary[] }>('/api/admin/sites')
const selected = ref(me.value?.site.siteId || '')
async function change() { await $fetch('/api/admin/site-selection', { method: 'POST', body: { siteId: selected.value } }); emit('changed'); await refreshNuxtData() }
</script>
