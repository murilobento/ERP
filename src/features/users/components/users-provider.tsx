import { createEntityProvider } from '@/features/shared/create-entity-provider'
import { type User } from '../data/schema'

type UsersDialogType = 'invite' | 'add' | 'edit'

const { Provider: UsersProvider, useEntity: useUsers } =
  createEntityProvider<User, UsersDialogType>('Users')

// eslint-disable-next-line react-refresh/only-export-components
export { UsersProvider, useUsers }
