<script setup lang="ts">
import * as d3 from 'd3-hierarchy'
import { computed, toRefs } from 'vue'

interface CategoryData {
  id: string
  name: string
  amount: number
  color?: string
}

const props = defineProps<{
  data: CategoryData[]
}>()

const { data } = toRefs(props)

// Fixed virtual size for calculations - SVG scales automatically via viewBox
const width = 600
const height = 400

const bubbles = computed<d3.HierarchyCircularNode<CategoryData>[]>(() => {
  if (!data.value || data.value.length === 0) return []

  // Create hierarchy
  const root = d3.hierarchy<{ children: CategoryData[] }>({ children: data.value })
    .sum(d => ('amount' in d ? d.amount : 0))
    .sort((a, b) => (b.value || 0) - (a.value || 0))

  // Create pack layout
  const pack = d3.pack<{ children: CategoryData[] }>()
    .size([width, height])
    .padding(12)

  pack(root)

  return root.descendants().slice(1) as d3.HierarchyCircularNode<CategoryData>[] // Skip root node
})

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(val)
}
</script>

<template>
  <div class="w-full h-full relative group cursor-crosshair">
    <svg 
      :viewBox="`0 0 ${width} ${height}`" 
      class="w-full h-full drop-shadow-xl"
      preserveAspectRatio="xMidYMid meet"
    >
      <transition-group name="fade">
        <g 
          v-for="node in bubbles" 
          :key="node.data.id"
          class="transition-all duration-700 ease-out hover:scale-[1.05]"
          :style="{ transformOrigin: `${node.x}px ${node.y}px` }"
        >
          <!-- Bubble Circle -->
          <circle
            :cx="node.x"
            :cy="node.y"
            :r="node.r"
            :fill="node.data.color || 'hsl(var(--secondary))'"
            class="transition-all duration-300 hover:brightness-110"
            style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
          />
          
          <!-- Glossy Effect Overlay -->
          <circle
            :cx="node.x"
            :cy="node.y"
            :r="node.r"
            fill="url(#glossyGradient)"
            class="pointer-events-none opacity-40"
          />

          <!-- Text Labels -->
          <g v-if="node.r > 35" class="pointer-events-none fade-in">
            <text
              :x="node.x"
              :y="node.y - 4"
              text-anchor="middle"
              class="text-[14px] font-black fill-white uppercase tracking-tighter select-none drop-shadow-md"
              style="font-family: inherit;"
            >
              {{ node.data.name }}
            </text>
            <text
              :x="node.x"
              :y="node.y + 14"
              text-anchor="middle"
              class="text-[11px] font-bold fill-foreground/80 currency select-none drop-shadow-md"
              style="font-family: inherit;"
            >
              {{ formatCurrency(node.data.amount) }}
            </text>
          </g>
          
          <!-- Tooltip -->
          <title>{{ node.data.name }}: {{ formatCurrency(node.data.amount) }}</title>
        </g>
      </transition-group>

      <!-- Definitions for Gradients -->
      <defs>
        <radialGradient id="glossyGradient" cx="30%" cy="30%" r="50%">
          <stop offset="0%" stop-color="white" stop-opacity="0.5" />
          <stop offset="100%" stop-color="white" stop-opacity="0" />
        </radialGradient>
      </defs>
    </svg>
    
    <div v-if="data.length === 0" class="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
      Sem dados para exibir
    </div>
  </div>
</template>

<style scoped>
.currency {
  font-feature-settings: "tnum";
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
