<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="space-y-8 animate-pulse">
    
    <!-- Health Dashboard Skeleton -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Skeleton class="h-32 rounded-xl" v-for="i in 4" :key="i" />
    </div>

    <!-- Main Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Left Column (Timeline & Chart) -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Timeline Map Skeleton -->
        <div class="rounded-3xl border p-6 space-y-4">
          <div class="flex justify-between items-center mb-6">
             <Skeleton class="h-8 w-48 rounded-lg" />
             <div class="flex gap-2">
               <Skeleton class="h-6 w-20 rounded-full" />
               <Skeleton class="h-6 w-20 rounded-full" />
             </div>
          </div>
          <!-- Month Bars -->
          <div class="space-y-2">
             <div v-for="j in 12" :key="j" class="flex items-center gap-4">
               <Skeleton class="h-4 w-12 rounded" />
               <Skeleton class="h-4 flex-1 rounded-full" />
               <Skeleton class="h-4 w-24 rounded" />
             </div>
          </div>
        </div>

        <!-- Limit Chart Skeleton -->
        <div class="rounded-3xl border p-6 min-h-[300px] flex items-end justify-between gap-2">
           <Skeleton v-for="k in 12" :key="k" class="w-full rounded-t-lg" :style="{ height: `${Math.random() * 60 + 20}%` }" />
        </div>
      </div>

      <!-- Right Column (Tools) -->
      <div class="space-y-6">
        <!-- Simulator Skeleton -->
        <div class="rounded-3xl border p-6 h-[400px] space-y-4">
           <Skeleton class="h-8 w-3/4 rounded-lg" />
           <Skeleton class="h-4 w-full rounded" />
           <Skeleton class="h-12 w-full rounded-xl mt-8" />
           <Skeleton class="h-12 w-full rounded-xl" />
        </div>

        <!-- Optimizer Skeleton -->
        <div class="rounded-3xl border p-6 h-[200px] space-y-4">
           <Skeleton class="h-6 w-1/2 rounded-lg" />
           <Skeleton class="h-24 w-full rounded-xl" />
        </div>
      </div>

    </div>
  </div>
</template>
