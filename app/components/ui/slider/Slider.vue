<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"

const props = withDefaults(defineProps<SliderRootProps & { class?: HTMLAttributes["class"]; variant?: "default" | "ai" }>(), {
  variant: "default",
})
const emits = defineEmits<SliderRootEmits>()

const delegatedProps = reactiveOmit(props, "class", "variant")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SliderRoot
    :class="cn(
      'relative flex w-full touch-none select-none items-center data-[orientation=vertical]:flex-col data-[orientation=vertical]:w-1.5 data-[orientation=vertical]:h-full',
      props.class,
    )"
    v-bind="forwarded"
  >
    <SliderTrack
      :class="cn(
        'relative h-1.5 w-full data-[orientation=vertical]:w-1.5 grow overflow-hidden rounded-full',
        props.variant === 'ai' ? 'bg-ai-accent/20' : 'bg-primary/20'
      )"
    >
      <SliderRange
        :class="cn(
          'absolute h-full data-[orientation=vertical]:w-full',
          props.variant === 'ai' ? 'bg-ai-accent' : 'bg-primary'
        )"
      />
    </SliderTrack>
    <SliderThumb
      v-for="(_, key) in modelValue"
      :key="key"
      :class="cn(
        'block h-5 w-5 rounded-full border-2 bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        props.variant === 'ai'
          ? 'border-ai-accent focus-visible:ring-ai-accent/40'
          : 'border-primary focus-visible:ring-ring'
      )"
    />
  </SliderRoot>
</template>
