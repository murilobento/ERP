import {
  LayoutDashboard,
  Users,
  UserCheck,
  Command,
  GalleryVerticalEnd,
  Wallet,
  Shield,
  ShoppingCart,
  Package,
  PackagePlus,
  Factory,
  Warehouse,
  ClipboardList,
  BoxesIcon,
  Truck,
  Building2,
} from 'lucide-react'
import { type SidebarData } from '../types'

const dashboard = { title: 'Painel', url: '/', icon: LayoutDashboard }

export const sidebarData: SidebarData = {
  user: {
    name: '',
    email: '',
    avatar: '',
  },
  teams: [
    {
      name: 'Shadcn Admin',
      logo: Command,
      plan: 'Free',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
  ],
  modules: [
    { name: 'Financeiro', icon: Wallet },
    { name: 'Administrativo', icon: Shield },
    { name: 'Comercial', icon: ShoppingCart },
    { name: 'Estoque', icon: Package },
  ],
  navGroupsByModule: {
    Financeiro: [
      {
        title: 'Geral',
        items: [dashboard],
      },
    ],
    Administrativo: [
      {
        title: 'Geral',
        items: [dashboard, { title: 'Usuários', url: '/users', icon: Users }],
      },
    ],
    Comercial: [
      {
        title: 'Geral',
        items: [
          dashboard,
          { title: 'Clientes', url: '/clients', icon: UserCheck },
          { title: 'Fornecedores', url: '/vendors', icon: Building2 },
        ],
      },
    ],
    Estoque: [
      {
        title: 'Geral',
        items: [
          dashboard,
          { title: 'Produtos', url: '/products', icon: BoxesIcon },
          { title: 'Insumos', url: '/supplies', icon: PackagePlus },
          { title: 'Produções', url: '/productions', icon: Factory },
          { title: 'Compras', url: '/purchases', icon: Truck },
          { title: 'Acerto de Estoque', url: '/stock', icon: Warehouse },
          { title: 'Movimentações', url: '/stock/movements', icon: ClipboardList },
        ],
      },
    ],
  },
}
