import { useThemeStore } from './stores/theme'
import { light, dark } from './colors'

export function useColors() {
  const isDark = useThemeStore(s => s.isDark)
  return isDark ? dark : light
}
