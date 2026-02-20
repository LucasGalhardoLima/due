import type { OAuthStrategy } from '@clerk/types'

type AuthStep = 'email' | 'code' | 'complete'
type AuthIntent = 'sign-in' | 'sign-up'

const CLERK_ERROR_MAP: Record<string, string> = {
  form_identifier_not_found: 'Nenhuma conta encontrada com esse e-mail.',
  form_password_incorrect: 'Senha incorreta.',
  form_code_incorrect: 'Codigo incorreto. Tente novamente.',
  too_many_attempts: 'Muitas tentativas. Aguarde um momento e tente novamente.',
  form_identifier_exists: 'Esse e-mail ja esta cadastrado.',
  session_exists: 'Voce ja esta logado. Redirecionando...',
  form_param_nil: 'Preencha todos os campos.',
  verification_expired: 'O codigo expirou. Solicite um novo.',
  verification_failed: 'Verificacao falhou. Tente novamente.',
}

function parseClerkError(err: unknown): string {
  if (err && typeof err === 'object' && 'errors' in err) {
    const clerkErr = err as { errors: Array<{ code?: string; message?: string; longMessage?: string }> }
    const first = clerkErr.errors[0]
    if (first?.code && CLERK_ERROR_MAP[first.code]) {
      return CLERK_ERROR_MAP[first.code]
    }
    return first?.longMessage || first?.message || 'Erro inesperado. Tente novamente.'
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'Erro inesperado. Tente novamente.'
}

export function useAuthFlow() {
  const { signIn, isLoaded: isSignInLoaded } = useSignIn()
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp()
  const { setActive } = useClerk()
  const router = useRouter()

  const step = ref<AuthStep>('email')
  const intent = ref<AuthIntent>('sign-in')
  const email = ref('')
  const error = ref('')
  const loading = ref(false)
  const resendCountdown = ref(0)

  let resendTimer: ReturnType<typeof setInterval> | null = null

  function startResendTimer() {
    resendCountdown.value = 60
    if (resendTimer) clearInterval(resendTimer)
    resendTimer = setInterval(() => {
      resendCountdown.value--
      if (resendCountdown.value <= 0) {
        clearInterval(resendTimer!)
        resendTimer = null
      }
    }, 1000)
  }

  async function submitEmail(emailValue: string) {
    if (!isSignInLoaded.value || !isSignUpLoaded.value) return
    error.value = ''
    loading.value = true
    email.value = emailValue

    try {
      // Try sign-in first
      const result = await signIn.value!.create({
        strategy: 'email_code',
        identifier: emailValue,
      })

      if (result.status === 'needs_first_factor') {
        intent.value = 'sign-in'
        step.value = 'code'
        startResendTimer()
      }
    } catch (err: unknown) {
      // Check if it's "identifier not found" → fall back to sign-up
      const isNotFound =
        err &&
        typeof err === 'object' &&
        'errors' in err &&
        (err as { errors: Array<{ code?: string }> }).errors.some(
          (e) => e.code === 'form_identifier_not_found',
        )

      if (isNotFound) {
        try {
          await signUp.value!.create({ emailAddress: emailValue })
          await signUp.value!.prepareEmailAddressVerification({
            strategy: 'email_code',
          })
          intent.value = 'sign-up'
          step.value = 'code'
          startResendTimer()
        } catch (signUpErr) {
          error.value = parseClerkError(signUpErr)
        }
      } else {
        error.value = parseClerkError(err)
      }
    } finally {
      loading.value = false
    }
  }

  async function verifyCode(code: string) {
    if (!isSignInLoaded.value || !isSignUpLoaded.value) return
    error.value = ''
    loading.value = true

    try {
      if (intent.value === 'sign-in') {
        const result = await signIn.value!.attemptFirstFactor({
          strategy: 'email_code',
          code,
        })
        if (result.status === 'complete' && result.createdSessionId) {
          step.value = 'complete'
          await setActive({ session: result.createdSessionId })
          await router.push('/dashboard')
        }
      } else {
        const result = await signUp.value!.attemptEmailAddressVerification({ code })
        if (result.status === 'complete' && result.createdSessionId) {
          step.value = 'complete'
          await setActive({ session: result.createdSessionId })
          await router.push('/dashboard')
        }
      }
    } catch (err) {
      error.value = parseClerkError(err)
    } finally {
      loading.value = false
    }
  }

  async function startOAuth(provider: OAuthStrategy) {
    if (!isSignInLoaded.value) return
    error.value = ''
    loading.value = true

    try {
      await signIn.value!.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      })
    } catch (err: unknown) {
      // If sign-in redirect fails, try sign-up redirect
      const isNotFound =
        err &&
        typeof err === 'object' &&
        'errors' in err &&
        (err as { errors: Array<{ code?: string }> }).errors.some(
          (e) => e.code === 'form_identifier_not_found',
        )

      if (isNotFound && isSignUpLoaded.value) {
        try {
          await signUp.value!.authenticateWithRedirect({
            strategy: provider,
            redirectUrl: '/sso-callback',
            redirectUrlComplete: '/dashboard',
          })
        } catch (signUpErr) {
          error.value = parseClerkError(signUpErr)
          loading.value = false
        }
      } else {
        error.value = parseClerkError(err)
        loading.value = false
      }
    }
  }

  async function resendCode() {
    if (resendCountdown.value > 0) return
    if (!isSignInLoaded.value || !isSignUpLoaded.value) return
    error.value = ''

    try {
      if (intent.value === 'sign-in') {
        await signIn.value!.create({
          strategy: 'email_code',
          identifier: email.value,
        })
      } else {
        await signUp.value!.prepareEmailAddressVerification({
          strategy: 'email_code',
        })
      }
      startResendTimer()
    } catch (err) {
      error.value = parseClerkError(err)
    }
  }

  function reset() {
    step.value = 'email'
    error.value = ''
    loading.value = false
    if (resendTimer) {
      clearInterval(resendTimer)
      resendTimer = null
    }
    resendCountdown.value = 0
  }

  function setIntent(newIntent: AuthIntent) {
    intent.value = newIntent
  }

  onUnmounted(() => {
    if (resendTimer) clearInterval(resendTimer)
  })

  return {
    step: readonly(step),
    intent: readonly(intent),
    email: readonly(email),
    error: readonly(error),
    loading: readonly(loading),
    resendCountdown: readonly(resendCountdown),
    submitEmail,
    verifyCode,
    startOAuth,
    resendCode,
    reset,
    setIntent,
  }
}
