# 测试环境设置
import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// 全局 mock
vi.mock('@/services/http/HttpClient')
vi.mock('@/stores/auth')
vi.mock('@/stores/groups')
vi.mock('@/stores/subscriptionGroups')

// Vue Test Utils 配置
global.config = config

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value)
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock URL
global.URL = {
  createObjectURL: vi.fn(),
  revokeObjectURL: vi.fn()
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock fetch API
global.fetch = vi.fn()

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn()
}

// 设置测试超时
vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 10000
})

// Mock Element.prototype.closest
Element.prototype.closest = vi.fn()

// Mock Element.prototype.matches
Element.prototype.matches = vi.fn(() => false)

// Mock DOMRect
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  width: 1024,
  height: 768,
  top: 0,
  left: 0,
  bottom: 768,
  right: 1024,
  x: 0,
  y: 0,
  toJSON: vi.fn()
}))

// Mock window.getComputedStyle
window.getComputedStyle = vi.fn(() => ({
  getPropertyValue: vi.fn(),
  cssText: '',
  length: 0
}))

// Mock HTMLElement.style
Object.defineProperty(HTMLElement.prototype, 'style', {
  value: {
    cssText: ''
  },
  writable: true,
  configurable: true
})