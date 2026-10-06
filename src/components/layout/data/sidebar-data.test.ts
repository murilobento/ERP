import { describe, expect, it } from 'vitest'
import { moduleForPath, sidebarData } from './sidebar-data'

describe('moduleForPath', () => {
  it('returns undefined for unknown paths', () => {
    expect(moduleForPath('/nonexistent')).toBeUndefined()
  })

  it('resolves modules by exact url match', () => {
    expect(moduleForPath('/vendors')?.name).toBe('Estoque')
    expect(moduleForPath('/sales')?.name).toBe('Comercial')
    expect(moduleForPath('/users')?.name).toBe('Administrativo')
    expect(moduleForPath('/stock/movements')?.name).toBe('Estoque')
  })

  it('resolves the root path to the module owning /', () => {
    expect(moduleForPath('/')?.name).toBe('Financeiro')
  })

  it('resolves sub-paths by first segment fallback', () => {
    expect(moduleForPath('/stock/some-sub-route')?.name).toBe('Estoque')
    expect(moduleForPath('/vendors/42')?.name).toBe('Estoque')
  })

  it('always returns a module from the sidebar modules list', () => {
    const module = moduleForPath('/purchases')
    expect(module).toBeDefined()
    expect(sidebarData.modules).toContain(module)
  })
})
