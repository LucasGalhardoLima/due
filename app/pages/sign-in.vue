<script setup lang="ts">
definePageMeta({
  layout: false
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-background px-4">
    <div class="w-full max-w-sm">
      <AuthForm initial-intent="sign-in" />
    </div>
  </div>
</template>
