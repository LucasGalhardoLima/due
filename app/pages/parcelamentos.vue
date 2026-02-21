<script setup lang="ts">
import { computed } from 'vue'
import { CalendarRange } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
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
  <div class="app-page">
    <PageHeader
      title="Parcelamentos"
      subtitle="Analise o impacto futuro das suas compras e otimize seu limite."
      :icon="CalendarRange"
    />

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
            <div class="relative overflow-hidden rounded-[2rem] border border-ai-accent/30 bg-[linear-gradient(145deg,hsl(var(--ai-accent)/0.16),hsl(var(--secondary)/0.08))] dark:bg-[linear-gradient(145deg,hsl(var(--ai-accent)/0.26),hsl(var(--secondary)/0.20))] p-6 shadow-elevation-2 min-h-[400px] transition-all duration-500 hover:border-ai-accent/45">
               <div class="relative z-10">
                 <UnifiedSimulator />
               </div>
            </div>
  
            <!-- Optimizer (Phase 4) -->
             <div class="relative overflow-hidden rounded-[2rem] border border-ai-accent/30 bg-[linear-gradient(145deg,hsl(var(--ai-accent)/0.16),hsl(var(--secondary)/0.08))] dark:bg-[linear-gradient(145deg,hsl(var(--ai-accent)/0.26),hsl(var(--secondary)/0.20))] p-6 shadow-elevation-2 min-h-[200px] transition-all duration-500 hover:border-ai-accent/45">
                <div class="relative z-10">
                  <InstallmentOptimizer />
                </div>
            </div>
  
          </div>
        </div>
      </div>
  </div>
</template>
