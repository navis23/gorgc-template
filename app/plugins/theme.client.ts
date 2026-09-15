export default defineNuxtPlugin(() => {
  const stored = localStorage.getItem('gorg-theme') ?? 'system'
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = stored === 'dark' || (stored === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
})
