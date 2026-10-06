<template>
  <section class="feature-panel">
    <p class="eyebrow">Interactive feature</p>
    <h1>나의 독서 성향 알아보기</h1>
    <p class="lede">문서가 아닌 입력·계산·상태가 필요한 기능은 MongoDB 콘텐츠가 아니라 코드로 관리됩니다.</p>
    <form class="feature-form" @submit.prevent="calculate">
      <label v-for="question in questions" :key="question.key">
        <span>{{ question.label }}</span>
        <input v-model.number="answers[question.key]" type="range" min="1" max="5">
        <strong>{{ answers[question.key] }}</strong>
      </label>
      <button class="button primary" type="submit">결과 확인</button>
    </form>
    <div v-if="result" class="result-card">
      <small>진단 결과</small>
      <h2>{{ result }}</h2>
    </div>
  </section>
</template>

<script setup lang="ts">
const questions = [
  { key: 'focus', label: '한 번 읽기 시작하면 오래 집중한다' },
  { key: 'variety', label: '여러 분야의 책을 골고루 읽는다' },
  { key: 'notes', label: '읽은 내용을 기록하거나 나눈다' },
] as const
const answers = reactive<Record<string, number>>({ focus: 3, variety: 3, notes: 3 })
const result = ref('')
function calculate() {
  const score = Object.values(answers).reduce((sum, value) => sum + value, 0)
  result.value = score >= 12 ? '깊이 읽고 확장하는 탐구형 독자' : score >= 8 ? '균형 있게 즐기는 성장형 독자' : '가볍게 시작하는 발견형 독자'
}
</script>
