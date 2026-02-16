<script setup lang="ts">
const props = defineProps<{
  initialIntent?: 'sign-in' | 'sign-up'
}>()

const {
  step,
  intent,
  email,
  error,
  loading,
  resendCountdown,
  submitEmail,
  verifyCode,
  startOAuth,
  resendCode,
  reset,
  setIntent,
} = useAuthFlow()

// Sync initial intent from props
if (props.initialIntent) {
  setIntent(props.initialIntent)
}

// Watch for parent intent changes
watch(
  () => props.initialIntent,
  (newIntent) => {
    if (newIntent) setIntent(newIntent)
  },
)

function switchIntent() {
  setIntent(intent.value === 'sign-in' ? 'sign-up' : 'sign-in')
}
</script>

<template>
  <div class="w-full overflow-hidden">
    <Transition
      mode="out-in"
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-x-4"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 -translate-x-4"
    >
      <AuthEmailStep
        v-if="step === 'email'"
        :intent="intent"
        :error="error"
        :loading="loading"
        @submit="submitEmail"
        @oauth="startOAuth"
        @switch-intent="switchIntent"
      />

      <AuthCodeStep
        v-else-if="step === 'code'"
        :email="email"
        :error="error"
        :loading="loading"
        :resend-countdown="resendCountdown"
        @verify="verifyCode"
        @resend="resendCode"
        @back="reset"
      />

      <div v-else class="flex flex-col items-center gap-4 py-8">
        <div class="size-12 rounded-full bg-success/20 flex items-center justify-center">
          <svg class="size-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p class="text-sm text-muted-foreground animate-pulse">Redirecionando...</p>
      </div>
    </Transition>
  </div>
</template>
