export type GorgConfirmTone = 'critical' | 'caution' | 'brand'

export interface GorgConfirmOptions {
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: GorgConfirmTone
  /** overrides the tone's default icon */
  icon?: string
  /**
   * For genuinely irreversible work: the confirm button stays disabled until
   * the user has typed this exact string.
   */
  requireText?: string
}

/** One settled question — what `<GorgConfirm />` actually renders. */
export interface GorgConfirmRequest {
  id: number
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  tone: GorgConfirmTone
  icon?: string
  requireText?: string
}

export interface GorgConfirmState {
  open: boolean
  request: GorgConfirmRequest | null
}

let seq = 0

/**
 * Resolvers live outside `useState` on purpose — functions are not
 * serialisable, and a question is only ever asked from a client interaction.
 */
const resolvers = new Map<number, (value: boolean) => void>()

export function useConfirm() {
  const state = useState<GorgConfirmState>('gorg-confirm', () => ({ open: false, request: null }))

  /** Answer the open question and hand the promise back to its caller. */
  function settle(value: boolean) {
    const request = state.value.request
    state.value.open = false
    if (!request)
      return
    const resolve = resolvers.get(request.id)
    resolvers.delete(request.id)
    resolve?.(value)
  }

  function confirm(options: GorgConfirmOptions = {}): Promise<boolean> {
    // A second question while one is still up answers the first with `false`
    // rather than stranding its promise forever.
    if (state.value.open)
      settle(false)

    const request: GorgConfirmRequest = {
      id: ++seq,
      title: options.title ?? 'Are you sure?',
      message: options.message ?? '',
      confirmLabel: options.confirmLabel ?? 'Confirm',
      cancelLabel: options.cancelLabel ?? 'Cancel',
      tone: options.tone ?? 'critical',
      icon: options.icon,
      requireText: options.requireText,
    }

    state.value.request = request
    state.value.open = true

    return new Promise<boolean>((resolve) => {
      resolvers.set(request.id, resolve)
    })
  }

  return {
    /** shared state a single mounted `<GorgConfirm />` renders from */
    state,
    confirm,
    accept: () => settle(true),
    cancel: () => settle(false),
  }
}
