<script setup lang="ts">
import { computed } from 'vue'
import { CalendarRange } from 'lucide-vue-next'
import HealthDashboard from '~/components/installments/HealthDashboard.vue'
import TimelineMap from '~/components/installments/TimelineMap.vue'
import UnifiedSimulator from '~/components/installments/UnifiedSimulator.vue'
import InstallmentOptimizer from '~/components/installments/InstallmentOptimizer.vue'
import LimitReleaseChart from '~/components/installments/LimitReleaseChart.vue'
import InstallmentsSkeleton from '~/components/installments/InstallmentsSkeleton.vue' // Import skeleton

definePageMeta({
  title: 'Parcelamentos',
  layout: 'default'
})

const { timelineStatus, healthStatus } = useInstallments()

const isLoading = computed(() => timelineStatus.value === 'pending' || healthStatus.value === 'pending')

// Mock cards list - ideally fetched from API or store
// For now, let's assume we can fetch cards or just show a selector.
// To keep it simple for this phase, we'll simulate a card selector being available
// or just rely on the global one if exists. 
// The prompt says "Card Selector (same pattern as dashboard, optional cardId filter)"
</script>

<template>
  <div class="min-h-screen bg-background pb-20">
    <div class="container mx-auto p-4 md:p-6 space-y-8">
      
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1">
           <h1 class="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
             <div class="p-2 bg-primary/10 rounded-xl">
               <CalendarRange class="w-6 h-6 text-primary" />
             </div>
             Gestão de Parcelamentos
           </h1>
           <p class="text-muted-foreground ml-14">
             Analise o impacto futuro das suas compras e otimize seu limite.
           </p>
        </div>
      </div>

      <!-- Loading State -->
      <InstallmentsSkeleton v-if="isLoading" />

      <!-- Main Content -->
      <div v-else class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <!-- Health Dashboard -->
        <section>
          <HealthDashboard />
        </section>
  
        <!-- Main Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Timeline (Left/Main Column) -->
          <div class="lg:col-span-2 space-y-8">
            <div class="rounded-[2rem] border border-border/70 bg-card p-6 shadow-elevation-2">
              <TimelineMap />
            </div>
  
            <!-- Chart (Phase 4) -->
            <div class="rounded-[2rem] border border-border/70 bg-card p-6 shadow-elevation-2 min-h-[300px]">
               <LimitReleaseChart />
            </div>
          </div>
  
          <!-- Sidebar Tools (Right Column) -->
          <div class="space-y-6">
            
            <!-- Simulator (Phase 3) -->
            <div class="rounded-[2rem] border border-ai-accent/30 bg-secondary/10 p-6 shadow-elevation-2 min-h-[400px] relative overflow-hidden">
               <div class="absolute -right-16 -top-16 w-56 h-56 bg-ai-accent/10 rounded-full blur-[70px] pointer-events-none" />
               <div class="absolute -left-16 -bottom-16 w-48 h-48 bg-secondary/10 rounded-full blur-[60px] pointer-events-none" />
               <div class="relative z-10">
                 <UnifiedSimulator />
               </div>
            </div>
  
            <!-- Optimizer (Phase 4) -->
             <div class="rounded-[2rem] border border-ai-accent/30 bg-secondary/10 p-6 shadow-elevation-2 min-h-[200px] relative overflow-hidden">
                <div class="absolute -right-16 -top-16 w-56 h-56 bg-ai-accent/10 rounded-full blur-[70px] pointer-events-none" />
                <div class="absolute -left-16 -bottom-16 w-48 h-48 bg-secondary/10 rounded-full blur-[60px] pointer-events-none" />
                <div class="relative z-10">
                  <InstallmentOptimizer />
                </div>
            </div>
  
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
