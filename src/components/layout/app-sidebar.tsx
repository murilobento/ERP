import { useState } from 'react'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,

  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { ModuleSwitcher } from './module-switcher'
import { type Module } from './types'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const [activeModule, setActiveModule] = useState<Module>(
    sidebarData.modules[0]
  )

  const navGroups = sidebarData.navGroupsByModule[activeModule.name] ?? []

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
        <div className='px-4 py-1'>
          <div className='h-px w-full bg-border' />
        </div>
        <ModuleSwitcher
          modules={sidebarData.modules}
          activeModule={activeModule}
          onModuleChange={setActiveModule}
        />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
