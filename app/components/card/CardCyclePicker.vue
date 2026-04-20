<script setup lang="ts">
import { computed, toRefs } from 'vue'
import { useCycleCalendar } from '@/composables/useCycleCalendar'

interface Props {
  modelValue: boolean | null
  closingDay: number | null | undefined
  dueDay: number | null | undefined
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { closingDay, dueDay } = toRefs(props)
const cycle = useCycleCalendar({ closingDay, dueDay })

const visible = computed(() => cycle.value !== null)

function pick(value: boolean) {
  if (value === false && cycle.value && !cycle.value.sameValid) return
  emit('update:modelValue', value)
}

function onKeydown(e: KeyboardEvent) {
  if (!cycle.value) return
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    const next = e.key === 'ArrowLeft' ? false : true
    pick(next)
  }
}

// Max line width (px) in the timeline — the longer grace gets the full width,
// shorter graces are scaled proportionally.
const MAX_LINE_PX = 180
const MIN_LINE_PX = 32
function lineWidth(days: number | null): string {
  if (days == null) return `${MIN_LINE_PX}px`
  const nextDays = cycle.value?.nextDays ?? 1
  const ratio = Math.min(1, Math.max(0.12, days / nextDays))
  return `${Math.round(MIN_LINE_PX + (MAX_LINE_PX - MIN_LINE_PX) * ratio)}px`
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0 -translate-y-1"
  >
    <div v-if="visible && cycle" class="space-y-3" role="radiogroup" aria-label="Ciclo da fatura" @keydown="onKeydown">
      <div class="flex items-baseline justify-between gap-3">
        <label class="text-micro text-muted-foreground ml-1">Ciclo da fatura</label>
        <p class="text-micro text-muted-foreground/70 hidden sm:block">Qual combina com o app do seu banco?</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <!-- Same month -->
        <button
          type="button"
          role="radio"
          :aria-checked="modelValue === false"
          :aria-disabled="!cycle.sameValid"
          :disabled="!cycle.sameValid"
          :tabindex="modelValue === false || (!cycle.sameValid && modelValue !== true) ? 0 : -1"
          class="group relative text-left rounded-xl border px-4 py-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 shadow-elevation-1 hover:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-elevation-1"
          :class="[
            modelValue === false
              ? 'border-primary/60 bg-primary/5 shadow-elevation-3'
              : 'border-border/70 bg-background hover:border-primary/30',
          ]"
          @click="pick(false)"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-micro font-semibold text-foreground">Mesmo mês</span>
            <span
              class="inline-block h-2.5 w-2.5 rounded-full transition-colors duration-200"
              :class="modelValue === false ? 'bg-primary' : 'bg-muted-foreground/30'"
              aria-hidden="true"
            />
          </div>

          <div v-if="cycle.sameValid" class="flex items-end gap-2 mb-3" aria-hidden="true">
            <div class="flex flex-col items-center">
              <span class="font-display text-2xl font-semibold tabular-nums leading-none text-foreground">{{ closingDay }}</span>
              <span class="text-micro text-muted-foreground mt-1 lowercase">{{ cycle.closeMonth }}</span>
            </div>
            <div class="flex-1 flex items-center justify-center pb-4">
              <span
                class="block h-[2px] rounded-full bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/30"
                :style="{ width: lineWidth(cycle.sameDays) }"
                :class="{ 'from-primary/50 to-primary': modelValue === false }"
              />
            </div>
            <div class="flex flex-col items-center">
              <span class="font-display text-2xl font-semibold tabular-nums leading-none text-foreground">{{ dueDay }}</span>
              <span class="text-micro text-muted-foreground mt-1 lowercase">{{ cycle.dueSameMonth }}</span>
            </div>
          </div>

          <p v-if="cycle.sameValid" class="text-small font-medium text-foreground">
            {{ cycle.sameDays }} dias de prazo
          </p>
          <p v-else class="text-small font-medium text-muted-foreground">
            Não se aplica a este ciclo
          </p>
          <p class="text-micro text-muted-foreground/80 mt-1">
            <template v-if="cycle.sameValid">Raro · cartões com ciclo curto</template>
            <template v-else>Só faz sentido quando o vencimento é maior que o fechamento</template>
          </p>
        </button>

        <!-- Next month (recommended) -->
        <button
          type="button"
          role="radio"
          :aria-checked="modelValue === true"
          :tabindex="modelValue === true || (!cycle.sameValid && modelValue !== false) ? 0 : -1"
          class="group relative text-left rounded-xl border px-4 py-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 shadow-elevation-1 hover:shadow-elevation-2"
          :class="[
            modelValue === true
              ? 'border-primary/60 bg-primary/5 shadow-elevation-3'
              : 'border-border/70 bg-background hover:border-primary/30',
          ]"
          @click="pick(true)"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-micro font-semibold text-foreground">Mês seguinte</span>
              <span class="inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[0.625rem] leading-none font-semibold text-primary-accent border border-primary/25">
                Mais comum
              </span>
            </div>
            <span
              class="inline-block h-2.5 w-2.5 rounded-full transition-colors duration-200"
              :class="modelValue === true ? 'bg-primary' : 'bg-muted-foreground/30'"
              aria-hidden="true"
            />
          </div>

          <div class="flex items-end gap-2 mb-3" aria-hidden="true">
            <div class="flex flex-col items-center">
              <span class="font-display text-2xl font-semibold tabular-nums leading-none text-foreground">{{ closingDay }}</span>
              <span class="text-micro text-muted-foreground mt-1 lowercase">{{ cycle.closeMonth }}</span>
            </div>
            <div class="flex-1 flex items-center justify-center pb-4">
              <span
                class="block h-[2px] rounded-full bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/30"
                :style="{ width: lineWidth(cycle.nextDays) }"
                :class="{ 'from-primary/50 to-primary': modelValue === true }"
              />
            </div>
            <div class="flex flex-col items-center">
              <span class="font-display text-2xl font-semibold tabular-nums leading-none text-foreground">{{ dueDay }}</span>
              <span class="text-micro text-muted-foreground mt-1 lowercase">{{ cycle.dueNextMonth }}</span>
            </div>
          </div>

          <p class="text-small font-medium text-foreground">
            {{ cycle.nextDays }} dias de prazo
          </p>
          <p class="text-micro text-muted-foreground/80 mt-1">
            Nubank · Itaú · Inter · Bradesco · C6 · Santander
          </p>
        </button>
      </div>

      <p v-if="!cycle.sameValid && modelValue !== true" class="text-micro text-muted-foreground/80 ml-1">
        Com vencimento dia {{ dueDay }} e fechamento dia {{ closingDay }}, só faz sentido o ciclo "mês seguinte".
      </p>
    </div>
  </Transition>
</template>
