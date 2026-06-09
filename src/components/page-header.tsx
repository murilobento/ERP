import { ConfigDrawer } from '@/components/config-drawer'
import { FullscreenToggle } from '@/components/fullscreen-toggle'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

type PageHeaderProps = {
  fixed?: boolean
}

export function PageHeader({ fixed = true }: PageHeaderProps) {
  return (
    <Header fixed={fixed}>
      <Search className='me-auto' />
      <ThemeSwitch />
      <FullscreenToggle />
      <ConfigDrawer />
      <ProfileDropdown />
    </Header>
  )
}
