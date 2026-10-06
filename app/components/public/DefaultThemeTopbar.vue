<template>
  <header class="theme-topbar">
    <div :class="['theme-topbar-inner', { 'theme-topbar-inner-full': fullWidth, 'theme-topbar-inner-backend': backendMode }]">
      <NuxtLink class="theme-brand" to="/">
        <span class="theme-logo-mark">MS</span>
        <span class="theme-brand-text">{{ displayTitle }}</span>
      </NuxtLink>
      <div v-if="toolbarTitle && !backendMode" class="theme-topbar-title">{{ toolbarTitle }}</div>
      <SiteSwitcher v-if="backendMode" class="theme-topbar-site" @changed="reloadPage" />
      <button v-if="!hideNav || backendMenuButton" :class="['theme-menu-button', { open: isMobileMenuOpen }]" type="button" @click="handleMenuButtonClick">
        <span></span><span></span><span></span>
      </button>
      <nav v-if="!hideNav" :class="['theme-nav', { open: isMobileMenuOpen }]">
        <template v-for="item in items" :key="item.to + item.label">
          <div v-if="item.isHeader || item.children?.length" class="theme-nav-group">
            <span v-if="item.isHeader" class="theme-nav-header">{{ item.label }}<span v-if="item.children?.length" class="theme-nav-caret">▾</span></span>
            <NuxtLink v-else :to="item.to" :target="item.target === 'blank' ? '_blank' : undefined">{{ item.label }} <span class="theme-nav-caret">▾</span></NuxtLink>
            <div v-if="item.children?.length" class="theme-nav-dropdown"><NuxtLink v-for="child in item.children" :key="child.to + child.label" :to="child.to">{{ child.label }}</NuxtLink></div>
          </div>
          <NuxtLink v-else :to="item.to" :target="item.target === 'blank' ? '_blank' : undefined" @click="closeMobileMenu">{{ item.label }}</NuxtLink>
        </template>
      </nav>
      <div v-if="!hideNav" class="theme-auth"><NuxtLink class="theme-login" to="/backend/login">CMS</NuxtLink></div>
    </div>
  </header>
</template>
<script setup lang="ts">
import SiteSwitcher from '~/components/admin/SiteSwitcher.vue'
const props = defineProps<{ items: Array<{ label: string, to: string, current?: boolean, target?: 'self' | 'blank', isHeader?: boolean, children?: Array<{ label: string, to: string, target?: 'self' | 'blank' }> }>, fullWidth?: boolean, backendMode?: boolean, toolbarTitle?: string, hideNav?: boolean, backendMenuButton?: boolean }>()
const emit = defineEmits<{ 'backend-menu-toggle': [] }>()
const { data } = useSite()
// Backend는 요청 도메인이 아니라 선택한 작업 사이트를 편집하므로, 도메인 사이트명을 브랜드로 쓰지 않는다.
const displayTitle = computed(() => props.backendMode ? 'Backend' : data.value?.site.name || 'MultiSite')
const isMobileMenuOpen = ref(false)
function reloadPage() { window.location.reload() }
function closeMobileMenu() { isMobileMenuOpen.value = false }
function handleMenuButtonClick() { if (props.hideNav && props.backendMenuButton) emit('backend-menu-toggle'); else isMobileMenuOpen.value = !isMobileMenuOpen.value }
</script>
