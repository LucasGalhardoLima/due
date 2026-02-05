<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"
import { cardVariants, type CardVariants } from "."

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    variant?: CardVariants["variant"]
    size?: CardVariants["size"]
    interactive?: boolean
    glow?: CardVariants["glow"]
  }>(),
  {
    class: undefined,
    variant: "default",
    size: "default",
    interactive: false,
    glow: "none",
  }
)
</script>

<template>
  <div
    :class="
      cn(
        cardVariants({
          variant: props.variant,
          size: props.size,
          interactive: props.interactive,
          glow: props.glow,
        }),
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
