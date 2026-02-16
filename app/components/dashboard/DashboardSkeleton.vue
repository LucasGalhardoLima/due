<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="space-y-6">
    <!-- Desktop Header -->
    <div class="hidden lg:flex justify-between items-center">
      <div class="space-y-2">
        <Skeleton class="h-10 w-48 rounded-lg" />
        <Skeleton class="h-4 w-64 rounded" />
      </div>
      <div class="flex gap-4">
        <Skeleton class="h-10 w-44 rounded-2xl" />
        <Skeleton class="h-10 w-24 rounded-2xl" />
      </div>
    </div>

    <!-- Mobile Header -->
    <div class="lg:hidden space-y-4">
      <div class="space-y-2">
        <Skeleton class="h-8 w-32 rounded-lg" />
        <Skeleton class="h-4 w-40 rounded" />
      </div>
      <div class="flex items-center gap-3">
        <Skeleton class="h-10 flex-1 rounded-2xl" />
        <Skeleton class="h-10 w-36 rounded-full" />
      </div>
    </div>

    <!-- FreeToSpend Card -->
    <Skeleton class="h-28 rounded-3xl" />

    <!-- SummaryCards (4-col) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Skeleton v-for="i in 4" :key="i" class="h-32 rounded-3xl" />
    </div>

    <!-- AI Spotlight Row (desktop only) -->
    <div class="hidden lg:grid grid-cols-3 gap-5">
      <Skeleton class="h-44 rounded-3xl col-span-2" />
      <Skeleton class="h-44 rounded-3xl" />
    </div>

    <!-- Budget Widgets Row (3-col) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <Skeleton v-for="i in 3" :key="i" class="h-48 rounded-3xl" />
    </div>

    <!-- Transactions + Sidebar -->
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
      <!-- Transaction List -->
      <div class="rounded-3xl border border-border/70 p-6 space-y-6">
        <Skeleton class="h-8 w-40 rounded-lg" />
        <div class="space-y-4">
          <div v-for="j in 6" :key="j" class="flex items-center gap-4">
            <Skeleton class="h-10 w-10 rounded-xl" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-1/3 rounded" />
              <Skeleton class="h-3 w-1/4 rounded" />
            </div>
            <Skeleton class="h-5 w-20 rounded" />
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="hidden lg:block space-y-5">
        <Skeleton class="h-48 rounded-3xl" />
        <Skeleton class="h-64 rounded-3xl" />
        <Skeleton class="h-40 rounded-3xl" />
        <Skeleton class="h-32 rounded-3xl" />
      </div>
    </div>
  </div>
</template>
