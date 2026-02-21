<script setup lang="ts">
import { TIER_LABELS, type Tier } from '#shared/tier-config'

const props = defineProps<{
  tier: Tier
}>()

const label = computed(() => TIER_LABELS[props.tier])

const colorClass = computed(() => {
  switch (props.tier) {
    case 'pro': return 'bg-primary/15 text-primary-accent border-primary/25'
    case 'plus': return 'bg-primary/15 text-primary-foreground border-primary/25'
    default: return 'bg-muted text-muted-foreground border-border'
  }
})
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border"
    :class="colorClass"
  >
    {{ label }}
  </span>
</template>
