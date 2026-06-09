import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { FullscreenToggle } from '@/components/fullscreen-toggle'
import { ThemeSwitch } from '@/components/theme-switch'
import { useDocumentTitle } from '@/hooks/use-document-title'
import api from '@/lib/api'
import { AuditLogsTable } from './components/audit-logs-table'
import { type AuditLog } from './data/schema'

const route = getRouteApi('/_authenticated/audit-logs/')

export function AuditLogs() {
  useDocumentTitle('Logs de Auditoria')
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: logs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await api.get('/audit-logs')
      return res.data.logs as AuditLog[]
    },
  })

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <FullscreenToggle />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>
            Logs de Auditoria
          </h2>
          <p className='text-muted-foreground'>
            Histórico de alterações em usuários do sistema.
          </p>
        </div>
        <AuditLogsTable data={logs} search={search} navigate={navigate} />
      </Main>
    </>
  )
}
