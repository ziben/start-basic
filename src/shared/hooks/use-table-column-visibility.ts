import { useState, useCallback, useEffect } from 'react'
import type { VisibilityState } from '@tanstack/react-table'

const STORAGE_KEY_PREFIX = 'admin-table-visibility-'

export function useTableColumnVisibility({
    tableId,
    defaultVisibility = {},
}: {
    tableId: string
    defaultVisibility?: VisibilityState
}) {
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
        try {
            if (typeof window !== 'undefined') {
                const item = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${tableId}`)
                if (item) {
                    return JSON.parse(item) as VisibilityState
                }
            }
        } catch (error) {
            console.error(`Error reading localStorage key "${STORAGE_KEY_PREFIX}${tableId}":`, error)
        }
        return defaultVisibility
    })

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${tableId}`, JSON.stringify(columnVisibility))
            }
        } catch (error) {
            console.error(`Error saving localStorage key "${STORAGE_KEY_PREFIX}${tableId}":`, error)
        }
    }, [tableId, columnVisibility])

    const handleVisibilityChange = useCallback((updaterOrValue: VisibilityState | ((old: VisibilityState) => VisibilityState)) => {
        setColumnVisibility((old) =>
            typeof updaterOrValue === 'function' ? updaterOrValue(old) : updaterOrValue
        )
    }, [])

    return {
        columnVisibility,
        setColumnVisibility: handleVisibilityChange,
    }
}
