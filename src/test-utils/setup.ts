import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/**
 * Stubs para as APIs de browser que o jsdom não implementa. O browser mode do
 * Vitest as trazia de graça; sem elas, os componentes Radix (Select, Dialog,
 * Dropdown) estouram em `hasPointerCapture is not a function` e afins.
 */

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

if (!window.PointerEvent) {
  class PointerEvent extends MouseEvent {
    readonly pointerId: number
    readonly pointerType: string
    readonly isPrimary: boolean

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 1
      this.pointerType = params.pointerType ?? 'mouse'
      this.isPrimary = params.isPrimary ?? true
    }
  }

  Object.defineProperty(window, 'PointerEvent', {
    writable: true,
    value: PointerEvent,
  })
  Object.defineProperty(globalThis, 'PointerEvent', {
    writable: true,
    value: PointerEvent,
  })
}

const pointerCaptureStubs = [
  'hasPointerCapture',
  'setPointerCapture',
  'releasePointerCapture',
]

// `keyof Element` inclui propriedades read-only, então o prototype é tratado como
// um registro solto para poder receber os stubs.
const elementPrototype = Element.prototype as unknown as Record<string, unknown>

for (const method of pointerCaptureStubs) {
  if (typeof elementPrototype[method] === 'function') continue

  elementPrototype[method] = () => undefined
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {
    return undefined
  }
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {
      return undefined
    }
    unobserve() {
      return undefined
    }
    disconnect() {
      return undefined
    }
  }
  globalThis.ResizeObserver = window.ResizeObserver
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = class IntersectionObserver {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds: readonly number[] = []
    observe() {
      return undefined
    }
    unobserve() {
      return undefined
    }
    disconnect() {
      return undefined
    }
    takeRecords() {
      return []
    }
  } as unknown as typeof IntersectionObserver
  globalThis.IntersectionObserver = window.IntersectionObserver
}

afterEach(() => {
  cleanup()
})
