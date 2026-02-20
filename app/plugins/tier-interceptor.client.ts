export default defineNuxtPlugin(() => {
  const { show } = useUpgradeModal()

  // Intercept $fetch errors globally via onResponseError
  const _origFetch = globalThis.$fetch
  globalThis.$fetch = ((...args: Parameters<typeof _origFetch>) => {
    return _origFetch(...args).catch((err: unknown) => {
      if (
        err &&
        typeof err === 'object' &&
        'statusCode' in err &&
        (err as { statusCode: number }).statusCode === 403 &&
        'data' in err
      ) {
        const data = (err as { data: { upgradeRequired?: string; reason?: string } }).data
        if (data?.upgradeRequired) {
          show({
            reason: data.reason || '',
            upgradeTarget: data.upgradeRequired as 'plus' | 'pro',
          })
        }
      }
      throw err
    })
  }) as typeof _origFetch
})
