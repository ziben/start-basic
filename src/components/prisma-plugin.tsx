import { useMemo } from 'react'
import { createStudioBFFClient } from '@prisma/studio-core/data/bff'
import { createSQLiteAdapter } from '@prisma/studio-core/data/sqlite-core'
import { Studio } from '@prisma/studio-core/ui'
import '@prisma/studio-core/ui/index.css'

export function StudioPlugin() {
  const adapter = useMemo(() => {
    // 1. Create a client that points to your backend endpoint
    const executor = createStudioBFFClient({
      url: 'http://localhost:3000/studio',
    })

    // 2. Create a Postgres adapter with the executor
    const adapter = createSQLiteAdapter({ executor })
    return adapter
  }, [])

  return <Studio adapter={adapter} />
}
