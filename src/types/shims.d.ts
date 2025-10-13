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
