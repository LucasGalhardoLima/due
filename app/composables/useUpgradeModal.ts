import type { Tier } from '#shared/tier-config'

interface UpgradeModalState {
  isOpen: boolean
  reason: string
  upgradeTarget: Tier | null
}

const state = reactive<UpgradeModalState>({
  isOpen: false,
  reason: '',
  upgradeTarget: null,
})

export function useUpgradeModal() {
  function show(opts: { reason?: string; upgradeTarget?: Tier } = {}) {
    state.reason = opts.reason || ''
    state.upgradeTarget = opts.upgradeTarget || 'plus'
    state.isOpen = true
  }

  function hide() {
    state.isOpen = false
  }

  return {
    isOpen: toRef(state, 'isOpen'),
    reason: toRef(state, 'reason'),
    upgradeTarget: toRef(state, 'upgradeTarget'),
    show,
    hide,
  }
}
