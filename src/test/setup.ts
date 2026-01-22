import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

const createServerFnMock = () => {
  const api = {
    inputValidator: () => api,
    handler: (handler: (payload: unknown) => unknown) => (payload: unknown) => handler(payload),
  }
  return api
}

vi.mock('@tanstack/react-start', () => ({
  createServerFn: createServerFnMock,
}))

vi.mock('@tanstack/react-start/client', () => ({
  createServerFn: createServerFnMock,
}))

Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  value: 600,
})

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  value: 800,
})

