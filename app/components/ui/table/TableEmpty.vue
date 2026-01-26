<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  colspan?: number
}>(), {
  colspan: 1,
})
</script>

<template>
  <TableRow>
    <TableCell
      :class="cn('p-4 whitespace-nowrap align-middle text-sm text-foreground', props.class)"
      :colspan="colspan"
    >
      <slot />
    </TableCell>
  </TableRow>
</template>
