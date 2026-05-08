import * as React from "react"

const MOBILE_BREAKPOINT = 768
const mobileMediaQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

export function useIsMobile() {
  return React.useSyncExternalStore(subscribeToMobileChanges, getMobileSnapshot, getServerSnapshot)
}

function subscribeToMobileChanges(onStoreChange: () => void): () => void {
  const mql = window.matchMedia(mobileMediaQuery)
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

function getMobileSnapshot(): boolean {
  return window.matchMedia(mobileMediaQuery).matches
}

function getServerSnapshot(): boolean {
  return false
}
