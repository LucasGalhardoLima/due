<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  columns?: number
  items?: number
  headerHeight?: string
  cardHeight?: string
}

withDefaults(defineProps<Props>(), {
  columns: 3,
  items: 6,
  headerHeight: 'h-10',
  cardHeight: 'h-40'
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header Skeleton -->
    <div class="space-y-2">
      <Skeleton :class="[headerHeight, 'w-1/4 rounded-lg']" />
      <Skeleton class="h-4 w-1/3 rounded" />
    </div>

    <!-- Form/Top Card Skeleton -->
    <Skeleton class="h-32 w-full rounded-2xl" />

    <!-- Grid Skeleton -->
    <div class="grid gap-6 md:grid-cols-2" :class="{ 'lg:grid-cols-3': columns === 3 }">
      <Skeleton 
        v-for="i in items" 
        :key="i" 
        :class="[cardHeight, 'rounded-2xl']" 
      />
    </div>
  </div>
</template>
