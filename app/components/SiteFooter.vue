<template>
  <footer class="site-footer">
    <div class="shell footer-inner">
      <strong>{{ site.name }}</strong>
      <p>{{ site.description }}</p>
      <small>© {{ new Date().getFullYear() }} {{ site.name }}</small>
    </div>
  </footer>
</template>
<script setup lang="ts">defineProps<{ site: any }>()</script>
