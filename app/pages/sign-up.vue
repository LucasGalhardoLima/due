<script setup lang="ts">
import { SignUp } from 'vue-clerk'
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
    <SignUp redirect-url="/" sign-in-url="/sign-in" />
  </div>
</template>
