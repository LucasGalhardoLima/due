<script lang="ts" setup>
import type { DialogContentEmits, DialogContentProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { useForwardPropsEmits } from "reka-ui"
import { DrawerContent, DrawerPortal } from "vaul-vue"
import { cn } from "@/lib/utils"
import DrawerOverlay from "./DrawerOverlay.vue"

const props = defineProps<DialogContentProps & { class?: HTMLAttributes["class"] }>()
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, "class")
const forwardedProps = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerContent
      v-bind="forwardedProps" :class="cn(
        'fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[1.75rem] border border-border/70 bg-background/98 shadow-elevation-4 data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:duration-300 data-[state=closed]:duration-200',
        props.class,
      )"
    >
      <div class="mx-auto mt-4 h-1.5 w-[96px] rounded-full bg-muted transition-colors duration-200" />
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
