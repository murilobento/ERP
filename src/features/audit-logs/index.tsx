import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/page-header'
import { useDocumentTitle } from '@/hooks/use-document-title'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { AuditLogsTable } from './components/audit-logs-table'
import { type AuditLog } from './data/schema'

const route = getRouteApi('/_authenticated/audit-logs/')

export function AuditLogs() {
  useDocumentTitle('Logs de Auditoria')
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: logs = [] } = useQuery({
    queryKey: queryKeys.auditLogs,
    queryFn: async () => {
      const res = await api.get('/audit-logs')
      return res.data.logs as AuditLog[]
    },
  })

  return (
    <>
      <PageHeader />

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
