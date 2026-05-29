import { useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/theme-provider'
import { Button } from '@/components/ui/button'

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const resolved = theme === 'dark' ? '#020817' : '#fff'
    const meta = document.querySelector("meta[name='theme-color']")
    if (meta) meta.setAttribute('content', resolved)
  }, [theme])

  const isDark = theme === 'dark'

  return (
    <Button
      variant='ghost'
      size='icon'
      className='rounded-full'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label='Alternar tema'
    >
      {isDark ? <Sun className='size-[1.2rem]' /> : <Moon className='size-[1.2rem]' />}
    </Button>
  )
}
