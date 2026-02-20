<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="space-y-6">
    <!-- Overview Card Skeleton -->
    <Skeleton class="h-40 rounded-3xl" />

    <!-- Income List Skeleton -->
    <div class="space-y-3">
      <Skeleton class="h-5 w-32 rounded-lg" />
      <Skeleton v-for="i in 2" :key="i" class="h-16 rounded-2xl" />
    </div>

    <!-- Category List Skeleton -->
    <div class="space-y-3">
      <Skeleton class="h-5 w-40 rounded-lg" />
      <Skeleton v-for="i in 4" :key="i" class="h-14 rounded-2xl" />
    </div>
  </div>
</template>
