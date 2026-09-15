export interface Toast {
  id: number
  title?: string
  message: string
  tone: 'info' | 'positive' | 'caution' | 'critical'
  timeout: number
}

let seq = 0

export function useToast() {
  const toasts = useState<Toast[]>('gorg-toasts', () => [])

  function dismiss(id: number) {
    const i = toasts.value.findIndex(t => t.id === id)
    if (i !== -1)
      toasts.value.splice(i, 1)
  }

  function push(message: string, opts: Partial<Omit<Toast, 'id' | 'message'>> = {}) {
    const toast: Toast = {
      id: ++seq,
      message,
      tone: opts.tone ?? 'info',
      title: opts.title,
      timeout: opts.timeout ?? 4500,
    }
    toasts.value.push(toast)
    if (toast.timeout > 0 && import.meta.client)
      setTimeout(() => dismiss(toast.id), toast.timeout)
    return toast.id
  }

  return {
    toasts,
    push,
    dismiss,
    info: (m: string, o?: Partial<Toast>) => push(m, { ...o, tone: 'info' }),
    success: (m: string, o?: Partial<Toast>) => push(m, { ...o, tone: 'positive' }),
    warning: (m: string, o?: Partial<Toast>) => push(m, { ...o, tone: 'caution' }),
    error: (m: string, o?: Partial<Toast>) => push(m, { ...o, tone: 'critical' }),
  }
}
