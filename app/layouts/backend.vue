<template>
  <div class="backend-frame">
    <BackendSidebar @logout="logout" />
    <div class="backend-workspace">
      <header class="backend-topbar"><div><small>사이트별 데이터는 완전히 분리됩니다</small><strong>공통 관리 시스템</strong></div><SiteSwitcher @changed="reload" /></header>
      <main class="backend-main"><slot /></main>
    </div>
  </div>
</template>
<script setup lang="ts">
async function logout() { await $fetch('/api/admin/auth/logout', { method: 'POST' }); await navigateTo('/backend/login') }
function reload() { window.location.reload() }
</script>
