<script setup lang="ts">
import { Toaster as Sonner, type ToasterProps } from 'vue-sonner'

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :toast-options="{
      classes: {
        toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        success: 'group-[.toaster]:!bg-success group-[.toaster]:!text-success-foreground group-[.toaster]:!border-success/30',
        error: 'group-[.toaster]:!bg-danger group-[.toaster]:!text-danger-foreground group-[.toaster]:!border-danger/30',
        warning: 'group-[.toaster]:!bg-warning group-[.toaster]:!text-warning-foreground group-[.toaster]:!border-warning/30',
        info: 'group-[.toaster]:!bg-info group-[.toaster]:!text-info-foreground group-[.toaster]:!border-info/30',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
      },
    }"
  />
</template>
