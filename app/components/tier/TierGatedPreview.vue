<script setup lang="ts">
import { Lock, Sparkles, ArrowRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { TIER_LABELS, type Tier } from '#shared/tier-config'

const props = withDefaults(defineProps<{
  feature: string
  title?: string
  description?: string
  requiredTier?: Tier
}>(), {
  title: 'Recurso Premium',
  description: 'Este recurso esta disponivel nos planos pagos.',
  requiredTier: 'plus',
})

const { show } = useUpgradeModal()

function handleUpgrade() {
  show({
    reason: `${props.title} requer o plano ${TIER_LABELS[props.requiredTier]} ou superior.`,
    upgradeTarget: props.requiredTier,
  })
}
</script>

<template>
  <div class="relative min-h-[60vh] flex items-center justify-center">
    <!-- Blurred background slot -->
    <div class="absolute inset-0 overflow-hidden rounded-3xl opacity-30 blur-sm pointer-events-none">
      <slot />
    </div>

    <!-- Overlay -->
    <div class="relative z-10 max-w-sm mx-auto text-center space-y-5 p-8">
      <div class="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Lock class="w-7 h-7 text-primary-accent" />
      </div>

      <div class="space-y-2">
        <h2 class="text-xl font-bold">{{ title }}</h2>
        <p class="text-sm text-muted-foreground">{{ description }}</p>
      </div>

      <Button size="lg" class="w-full" @click="handleUpgrade">
        <Sparkles class="w-4 h-4 mr-1.5" />
        Upgrade para {{ TIER_LABELS[requiredTier] }}
        <ArrowRight class="w-4 h-4 ml-1.5" />
      </Button>
    </div>
  </div>
</template>
