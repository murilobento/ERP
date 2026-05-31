import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

type TeamSwitcherProps = {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const team = teams[0]
  const Logo = team.logo

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size='lg' asChild>
          <Link to='/'>
          <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
            <Logo className='size-4' />
          </div>
          <span className='truncate font-semibold text-sm'>{team.name}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
