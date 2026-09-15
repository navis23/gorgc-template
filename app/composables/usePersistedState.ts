import { useLocalStorage } from '@vueuse/core'

/**
 * localStorage-backed state that is hydration-safe.
 *
 * `useLocalStorage` returns the default on the server (no storage) but the
 * stored value on the client. If a user has changed the setting, the first
 * client render therefore disagrees with the SSR markup and Vue reports a
 * hydration mismatch. Holding the default until after mount makes the first
 * client render identical to SSR; the stored value is adopted on the next tick,
 * which is invisible to the user but keeps hydration exact.
 */
export function usePersistedState<T>(key: string, initial: T) {
  const stored = useLocalStorage<T>(key, initial)
  const hydrated = ref(false)

  onMounted(() => { hydrated.value = true })

  return computed<T>({
    get: () => (hydrated.value ? stored.value : initial),
    set: (value) => { stored.value = value },
  })
}
