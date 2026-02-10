<script setup lang="ts">
definePageMeta({
  layout: false
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-background">
    <SignIn redirect-url="/" sign-up-url="/sign-up" />
  </div>
</template>
