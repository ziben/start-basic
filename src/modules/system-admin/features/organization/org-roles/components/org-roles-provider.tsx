/**
 * 组织角色管理上下文
 */

import React, { createContext, useContext, useState, useCallback } from 'react'

interface OrgRole {
    id: string
    role: string
    permission: Record<string, string[]>
    organizationId: string
}

interface OrgRolesContextType {
    organizationId: string
    selectedRole: OrgRole | null
    setSelectedRole: (role: OrgRole | null) => void
    isCreateOpen: boolean
    openCreate: () => void
    closeCreate: () => void
    isEditOpen: boolean
    openEdit: (role: OrgRole) => void
    closeEdit: () => void
    isDeleteOpen: boolean
    openDelete: (role: OrgRole) => void
    closeDelete: () => void
}

const OrgRolesContext = createContext<OrgRolesContextType | null>(null)

export function useOrgRolesContext() {
    const context = useContext(OrgRolesContext)
    if (!context) {
        throw new Error('useOrgRolesContext must be used within OrgRolesProvider')
    }
    return context
}

interface OrgRolesProviderProps {
    children: React.ReactNode
    organizationId: string
}

export function OrgRolesProvider({ children, organizationId }: OrgRolesProviderProps) {
    const [selectedRole, setSelectedRole] = useState<OrgRole | null>(null)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    const openCreate = useCallback(() => setIsCreateOpen(true), [])
    const closeCreate = useCallback(() => setIsCreateOpen(false), [])

    const openEdit = useCallback((role: OrgRole) => {
        setSelectedRole(role)
        setIsEditOpen(true)
    }, [])
    const closeEdit = useCallback(() => {
        setIsEditOpen(false)
        setSelectedRole(null)
    }, [])

    const openDelete = useCallback((role: OrgRole) => {
        setSelectedRole(role)
        setIsDeleteOpen(true)
    }, [])
    const closeDelete = useCallback(() => {
        setIsDeleteOpen(false)
        setSelectedRole(null)
    }, [])

    // 监听自定义事件
    React.useEffect(() => {
        const handleCreate = () => openCreate()
        window.addEventListener('org-role:create', handleCreate)
        return () => window.removeEventListener('org-role:create', handleCreate)
    }, [openCreate])

    return (
        <OrgRolesContext.Provider
            value={{
                organizationId,
                selectedRole,
                setSelectedRole,
                isCreateOpen,
                openCreate,
                closeCreate,
                isEditOpen,
                openEdit,
                closeEdit,
                isDeleteOpen,
                openDelete,
                closeDelete,
            }}
        >
            {children}
        </OrgRolesContext.Provider>
    )
}
