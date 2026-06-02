import { useEffect, useState } from 'react'
import { Maximize, Minimize } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(!!document.fullscreenElement)

    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  function toggle() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      className='rounded-full'
      onClick={toggle}
      aria-label='Tela cheia'
    >
      {isFullscreen ? (
        <Minimize className='size-[1.2rem]' />
      ) : (
        <Maximize className='size-[1.2rem]' />
      )}
    </Button>
  )
}
