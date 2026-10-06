<template>
  <main class="login-page"><form class="login-panel" @submit.prevent="login"><p class="eyebrow">MultiSite CMS</p><h1>관리자 로그인</h1><p>환경변수에 설정한 관리자 키를 입력하세요.</p><label><span>관리자 키</span><input v-model="key" type="password" autocomplete="current-password" required></label><button class="button primary" :disabled="pending">{{ pending ? '확인 중…' : '로그인' }}</button><p v-if="error" class="form-error">{{ error }}</p></form></main>
</template>
<script setup lang="ts">
definePageMeta({ layout: false })
const route = useRoute(); const key = ref(''); const pending = ref(false); const error = ref('')
async function login() { pending.value = true; error.value = ''; try { await $fetch('/api/admin/auth/login', { method: 'POST', body: { key: key.value } }); await navigateTo(String(route.query.redirect || '/backend')) } catch (e: any) { error.value = e?.data?.statusMessage || '로그인하지 못했습니다.' } finally { pending.value = false } }
</script>
