import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Command } from 'lucide-react'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { type Company } from '@/features/company/data/schema'

type TeamSwitcherProps = {
  company?: Company | null
}

export function TeamSwitcher({ company }: TeamSwitcherProps) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | undefined>()
  const companyName = company?.name.trim() || 'Bendito Doce'
  const logoUrl = company?.logoUrl.trim()
  const showLogo = Boolean(logoUrl) && failedLogoUrl !== logoUrl

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size='lg' asChild>
          <Link to='/'>
            {showLogo ? (
              <img
                src={logoUrl}
                alt={companyName}
                className='size-8 rounded-lg object-contain'
                onError={() => setFailedLogoUrl(logoUrl)}
              />
            ) : (
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                <Command className='size-4' />
              </div>
            )}
            <span className='truncate text-sm font-semibold'>
              {companyName}
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
