import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { AdminNavItem } from '../data/schema';

interface AdminNavItemContextType {
  isCreateDialogOpen: boolean;
  setCreateDialogOpen: (isOpen: boolean) => void;
  isEditDialogOpen: boolean;
  setEditDialogOpen: (isOpen: boolean) => void;
  isDeleteDialogOpen: boolean;
  setDeleteDialogOpen: (isOpen: boolean) => void;
  selectedNavItem: AdminNavItem | null;
  setSelectedNavItem: (navItem: AdminNavItem | null) => void;
  navGroupId?: string;
  setNavGroupId: (id: string | undefined) => void;
}

const AdminNavItemContext = createContext<AdminNavItemContextType | undefined>(undefined);

export const useAdminNavItemContext = () => {
  const context = useContext(AdminNavItemContext);
  if (!context) {
    throw new Error('useAdminNavItemContext must be used within an AdminNavItemProvider');
  }
  return context;
};

interface AdminNavItemProviderProps {
  children: ReactNode;
  initialNavGroupId?: string;
}

const AdminNavItemProvider: React.FC<AdminNavItemProviderProps> = ({ children, initialNavGroupId }) => {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNavItem, setSelectedNavItem] = useState<AdminNavItem | null>(null);
  const [navGroupId, setNavGroupId] = useState<string | undefined>(initialNavGroupId);

  // 使用useMemo缓存context值，避免不必要的重渲染
  const contextValue = useMemo(() => ({
    isCreateDialogOpen,
    setCreateDialogOpen,
    isEditDialogOpen,
    setEditDialogOpen,
    isDeleteDialogOpen,
    setDeleteDialogOpen,
    selectedNavItem,
    setSelectedNavItem,
    navGroupId,
    setNavGroupId,
  }), [
    isCreateDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    selectedNavItem,
    navGroupId
  ]);

  return (
    <AdminNavItemContext.Provider value={contextValue}>
      {children}
    </AdminNavItemContext.Provider>
  );
};

export default AdminNavItemProvider;
