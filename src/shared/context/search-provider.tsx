import { createContext, useContext, useEffect, useState, useMemo, lazy, Suspense } from 'react'

// Define the lazy loaded component outside the render cycle
// Assuming default export or named export converted to default
const CommandMenu = lazy(() => import('@/components/command-menu').then(m => ({ default: m.CommandMenu })))

type SearchContextType = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SearchContext = createContext<SearchContextType | null>(null)

type SearchProviderProps = Readonly<{
  children: React.ReactNode
}>

export function SearchProvider({ children }: SearchProviderProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const contextValue = useMemo(() => ({ open, setOpen }), [open, setOpen])

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
      <Suspense fallback={null}>
        <CommandMenu />
      </Suspense>
    </SearchContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSearch = () => {
  const searchContext = useContext(SearchContext)

  if (!searchContext) {
    throw new Error('useSearch has to be used within SearchProvider')
  }

  return searchContext
}

