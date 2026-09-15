export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'gorg-theme'

export function useTheme() {
  const mode = useState<ThemeMode>('gorg-theme', () => 'system')

  const apply = (next: ThemeMode) => {
    if (!import.meta.client)
      return
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = next === 'dark' || (next === 'system' && prefersDark)
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  }

  onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    mode.value = stored ?? 'system'
    apply(mode.value)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => mode.value === 'system' && apply('system')
    mq.addEventListener('change', onChange)
    onScopeDispose(() => mq.removeEventListener('change', onChange))
  })

  const set = (next: ThemeMode) => {
    mode.value = next
    if (import.meta.client)
      localStorage.setItem(STORAGE_KEY, next)
    apply(next)
  }

  const isDark = computed(() => {
    if (!import.meta.client)
      return false
    return document.documentElement.classList.contains('dark')
  })

  const toggle = () => set(isDark.value ? 'light' : 'dark')

  return { mode, set, toggle, isDark }
}
