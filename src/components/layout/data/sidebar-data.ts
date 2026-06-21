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
        items: [
          { title: 'Painel Financeiro', url: '/', icon: BarChart3 },
        ],
      },
    ],
    Administrativo: [
      {
        title: 'Geral',
        items: [
          { title: 'Empresa', url: '/company', icon: Building2, minRole: 'admin' },
          { title: 'Usuários', url: '/users', icon: Users, minRole: 'admin' },
          { title: 'Logs de Auditoria', url: '/audit-logs', icon: ScrollText, minRole: 'admin' },
        ],
      },
    ],
    Comercial: [
      {
        title: 'Geral',
        items: [
          { title: 'Clientes', url: '/clients', icon: Contact },
          { title: 'Fornecedores', url: '/vendors', icon: Truck },
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
          { title: 'Insumos', url: '/supplies', icon: FlaskConical },
          { title: 'Kits', url: '/kits', icon: PackageCheck },
          { title: 'Movimentações', url: '/stock/movements', icon: ArrowRightLeft },
          { title: 'Produções', url: '/productions', icon: Factory },
          { title: 'Produtos', url: '/products', icon: PackageOpen },
        ],
      },
    ],
  },
}
