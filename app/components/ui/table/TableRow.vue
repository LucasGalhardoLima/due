<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <tr :class="cn('border-b transition-[background-color,transform] duration-200 ease-out hover:bg-muted/50 hover:translate-x-[1px] data-[state=selected]:bg-muted', props.class)">
    <slot />
  </tr>
</template>
