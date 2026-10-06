import {
  Users,
  Contact,
  Wallet,
  Shield,
  Store,
  Package,
  FlaskConical,
  Factory,
  Warehouse,
  ArrowRightLeft,
  PackageOpen,
  Truck,
  Building2,
  BadgeDollarSign,
  Tag,
  PackageCheck,
  ScrollText,
  BarChart3,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: '',
    email: '',
    avatar: '',
  },
  modules: [
    { name: 'Administrativo', icon: Shield },
    { name: 'Comercial', icon: Store },
    { name: 'Estoque', icon: Package },
    { name: 'Financeiro', icon: Wallet },
  ],
  navGroupsByModule: {
    Financeiro: [
      {
        title: 'Geral',
        items: [{ title: 'Painel Financeiro', url: '/', icon: BarChart3 }],
      },
    ],
    Administrativo: [
      {
        title: 'Geral',
        items: [
          {
            title: 'Empresa',
            url: '/company',
            icon: Building2,
            minRole: 'admin',
          },
          { title: 'Usuários', url: '/users', icon: Users, minRole: 'admin' },
          {
            title: 'Logs de Auditoria',
            url: '/audit-logs',
            icon: ScrollText,
            minRole: 'admin',
          },
        ],
      },
    ],
    Comercial: [
      {
        title: 'Geral',
        items: [
          { title: 'Clientes', url: '/clients', icon: Contact },
          { title: 'Vendas', url: '/sales', icon: BadgeDollarSign },
        ],
      },
    ],
    Estoque: [
      {
        title: 'Geral',
        items: [
          { title: 'Acerto de Estoque', url: '/stock', icon: Warehouse },
          { title: 'Categorias', url: '/categories', icon: Tag },
          { title: 'Compras', url: '/purchases', icon: Truck },
          { title: 'Fornecedores', url: '/vendors', icon: Truck },
          { title: 'Insumos', url: '/supplies', icon: FlaskConical },
          { title: 'Kits', url: '/kits', icon: PackageCheck },
          {
            title: 'Movimentações',
            url: '/stock/movements',
            icon: ArrowRightLeft,
          },
          { title: 'Produções', url: '/productions', icon: Factory },
          { title: 'Produtos', url: '/products', icon: PackageOpen },
        ],
      },
    ],
  },
}

/**
 * Resolve o módulo dono de um pathname por reverse lookup dos grupos de
 * navegação. Match exato primeiro (ex: /stock/movements), com fallback para o
 * primeiro segmento do caminho (ex: rotas-filhas de /stock). Rotas
 * admin-only não são filtradas aqui — a guarda de role é da rota.
 */
export function moduleForPath(pathname: string): Module | undefined {
  const firstSegment = `/${pathname.split('/')[1]}`

  const matchedModule = Object.entries(
    sidebarData.navGroupsByModule
  ).find(([, groups]) =>
    groups.some((group) =>
      group.items.some(
        (item) => item.url === pathname || item.url === firstSegment
      )
    )
  )

  return sidebarData.modules.find(
    (module) => module.name === matchedModule?.[0]
  )
}
