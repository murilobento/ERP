import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLayout } from '@/context/layout-provider'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useAuthStore } from '@/stores/auth-store'
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
import { type Company } from '@/features/company/data/schema'

type CompanyResponse = {
  company: Company | null
}

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const [activeModule, setActiveModule] = useState<Module>(
    sidebarData.modules[0]
  )
  const { auth } = useAuthStore()
  const userRole = auth.user?.role ?? 'viewer'
  const { data: company } = useQuery({
    queryKey: queryKeys.company,
    queryFn: async () => {
      const res = await api.get<CompanyResponse>('/company')
      return res.data.company
    },
  })

  const navGroups = (sidebarData.navGroupsByModule[activeModule.name] ?? []).map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.minRole) return true
      if (userRole === 'admin') return true
      return item.minRole === userRole
    }),
  }))

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher company={company} />
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
