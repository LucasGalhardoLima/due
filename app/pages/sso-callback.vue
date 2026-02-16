<script setup lang="ts">
definePageMeta({
  layout: false,
})

const clerk = useClerk()
const router = useRouter()
const error = ref('')

onMounted(async () => {
  try {
    await clerk.handleRedirectCallback({
      afterSignInUrl: '/dashboard',
      afterSignUpUrl: '/dashboard',
    })
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Erro ao finalizar login. Redirecionando...'
    setTimeout(() => {
      router.push('/')
    }, 3000)
  }
})
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center">
    <div class="flex flex-col items-center gap-4">
      <template v-if="!error">
        <div class="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p class="text-sm text-muted-foreground animate-pulse">Finalizando login...</p>
      </template>
      <template v-else>
        <p class="text-sm text-destructive text-center max-w-xs">{{ error }}</p>
        <p class="text-xs text-muted-foreground">Redirecionando...</p>
      </template>
    </div>
  </div>
</template>
