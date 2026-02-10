<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    size?: "sm" | "md" | "lg"
    position?: "top-right" | "bottom-right" | "top-left" | "bottom-left"
    color?: "white" | "primary" | "success" | "warning" | "danger" | "info"
  }>(),
  {
    class: undefined,
    size: "md",
    position: "bottom-right",
    color: "white",
  }
)

const sizeClasses = {
  sm: "w-20 h-20",
  md: "w-32 h-32",
  lg: "w-48 h-48",
}

const positionClasses = {
  "top-right": "-right-8 -top-8",
  "bottom-right": "-right-8 -bottom-8",
  "top-left": "-left-8 -top-8",
  "bottom-left": "-left-8 -bottom-8",
}

const colorClasses = {
  white: "bg-background/60 dark:bg-background/20",
  primary: "bg-primary/20 dark:bg-primary/10",
  success: "bg-success/20 dark:bg-success/10",
  warning: "bg-warning/20 dark:bg-warning/10",
  danger: "bg-danger/20 dark:bg-danger/10",
  info: "bg-info/20 dark:bg-info/10",
}
</script>

<template>
  <div
    :class="
      cn(
        'absolute rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none',
        sizeClasses[props.size],
        positionClasses[props.position],
        colorClasses[props.color],
        props.class,
      )
    "
  />
</template>
