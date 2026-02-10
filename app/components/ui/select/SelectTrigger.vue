<script setup lang="ts">
import type { SelectTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ChevronDown } from "lucide-vue-next"
import { SelectIcon, SelectTrigger, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<SelectTriggerProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectTrigger
    v-bind="forwardedProps"
    :class="cn(
      'flex h-11 w-full items-center justify-between whitespace-nowrap rounded-2xl border border-border/70 bg-background/80 backdrop-blur-md px-4 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/55 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate text-start transition-all duration-200 ease-out hover:bg-background hover:border-primary/35 hover:shadow-elevation-1 data-[state=open]:border-primary/55 data-[state=open]:shadow-elevation-2 data-[state=open]:[&_svg]:rotate-180',
      props.class,
    )"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="w-4 h-4 opacity-50 shrink-0 transition-transform duration-200" />
    </SelectIcon>
  </SelectTrigger>
</template>
