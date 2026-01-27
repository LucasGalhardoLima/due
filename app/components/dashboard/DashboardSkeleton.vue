<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="space-y-8 animate-pulse">
    <!-- Header Skeleton -->
    <div class="flex justify-between items-center hidden lg:flex">
      <div class="space-y-2">
        <Skeleton class="h-10 w-48 rounded-lg" />
        <Skeleton class="h-4 w-64 rounded" />
      </div>
      <div class="flex gap-4">
        <Skeleton class="h-10 w-44 rounded-xl" />
        <Skeleton class="h-10 w-24 rounded-xl" />
      </div>
    </div>

    <!-- Summary Cards Skeleton -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Skeleton class="h-32 rounded-3xl" v-for="i in 4" :key="i" />
    </div>

    <!-- Main Content Area -->
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
      <!-- Transaction List Skeleton -->
      <div class="rounded-3xl border p-6 space-y-6">
        <Skeleton class="h-8 w-40 rounded-lg" />
        <div class="space-y-4">
          <div v-for="j in 8" :key="j" class="flex items-center gap-4">
            <Skeleton class="h-10 w-10 rounded-xl" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-1/3 rounded" />
              <Skeleton class="h-3 w-1/4 rounded" />
            </div>
            <Skeleton class="h-5 w-20 rounded" />
          </div>
        </div>
      </div>

      <!-- Sidebar Skeleton -->
      <div class="space-y-6">
        <Skeleton class="h-48 rounded-3xl" />
        <Skeleton class="h-64 rounded-3xl" />
        <Skeleton class="h-32 rounded-3xl" />
      </div>
    </div>
  </div>
</template>
