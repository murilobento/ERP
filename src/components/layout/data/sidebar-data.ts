import {
  Users,
  UserCheck,
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
  BadgeDollarSign,
  Tag,
  PackageCheck,
  ScrollText,
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
    { name: 'Comercial', icon: ShoppingCart },
    { name: 'Estoque', icon: Package },
    { name: 'Financeiro', icon: Wallet },
  ],
  navGroupsByModule: {
    Financeiro: [],
    Administrativo: [
      {
        title: 'Geral',
        items: [
          { title: 'Empresa', url: '/company', icon: Building2 },
          { title: 'Usuários', url: '/users', icon: Users },
          { title: 'Logs de Auditoria', url: '/audit-logs', icon: ScrollText },
        ],
      },
    ],
    Comercial: [
      {
        title: 'Geral',
        items: [
          { title: 'Clientes', url: '/clients', icon: UserCheck },
          { title: 'Fornecedores', url: '/vendors', icon: Building2 },
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
          { title: 'Insumos', url: '/supplies', icon: PackagePlus },
          { title: 'Kits', url: '/kits', icon: PackageCheck },
          { title: 'Movimentações', url: '/stock/movements', icon: ClipboardList },
          { title: 'Produções', url: '/productions', icon: Factory },
          { title: 'Produtos', url: '/products', icon: BoxesIcon },
        ],
      },
    ],
  },
}
