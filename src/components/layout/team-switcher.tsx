import { Link } from '@tanstack/react-router'
import { Command } from 'lucide-react'
import { useState } from 'react'
import { type Company } from '@/features/company/data/schema'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

type TeamSwitcherProps = {
  company?: Company | null
}

export function TeamSwitcher({ company }: TeamSwitcherProps) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | undefined>()
  const companyName = company?.name.trim() || 'Shadcn Admin'
  const logoUrl = company?.logoUrl.trim()
  const showLogo = Boolean(logoUrl) && failedLogoUrl !== logoUrl

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size='lg' asChild>
          <Link to='/'>
            <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
              {showLogo ? (
                <img
                  src={logoUrl}
                  alt={companyName}
                  className='size-6 object-contain'
                  onError={() => setFailedLogoUrl(logoUrl)}
                />
              ) : (
                <Command className='size-4' />
              )}
            </div>
            <span className='truncate text-sm font-semibold'>{companyName}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
