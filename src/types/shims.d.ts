// Limited shims to reduce noise from third-party type differences
// Keep minimal and remove when upstream types are aligned.

// Allow importing certain modules that may not have types in this environment
declare module '@tanstack/react-start/api'

declare module '*.svg' {
  const content: string
  export default content
}

// widen some global types used in middleware/server fns
declare module '@tanstack/start-client-core' {
  // re-export minimal types if needed (kept empty to avoid errors)
}

// Minimal shims for @tanstack/react-start to satisfy TypeScript until
// upstream types are aligned with the project's usage.
declare module '@tanstack/react-start' {
  export function createServerFn(opts?: any): any
  export function createStart(opts?: any): any
  export function registerGlobalMiddleware(...args: any[]): any
  export function createMiddleware(...args: any[]): any
  export function createServerFileRoute(...args: any[]): any
}

declare module '@tanstack/react-start/plugin/vite' {
  export const tanstackStart: any
}
