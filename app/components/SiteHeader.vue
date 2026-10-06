<template>
  <header class="site-header">
    <div class="shell header-inner">
      <NuxtLink class="brand" to="/">{{ site.name }}</NuxtLink>
      <nav class="public-nav" aria-label="주 메뉴">
        <NuxtLink v-for="item in navItems" :key="item.title" :to="menuHref(item)" :target="item.target === 'blank' ? '_blank' : undefined">
          {{ item.title }}
        </NuxtLink>
      </nav>
      <NuxtLink class="admin-link" to="/backend">CMS</NuxtLink>
    </div>
  </header>
</template>

<script setup lang="ts">
const props = defineProps<{ site: any, menu?: any[] }>()
const navItems = computed(() => props.menu?.length ? props.menu : [
  { title: '글', type: 'url', url: '/posts' },
  { title: '페이지', type: 'url', url: '/pages' },
  { title: '카테고리', type: 'url', url: '/categories' },
])
</script>
