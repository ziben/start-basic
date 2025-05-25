import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AdminNavgroup } from '../data/schema';

interface AdminNavgroupContextType {
  isCreateDialogOpen: boolean;
  setCreateDialogOpen: (isOpen: boolean) => void;
  isEditDialogOpen: boolean;
  setEditDialogOpen: (isOpen: boolean) => void;
  isDeleteDialogOpen: boolean;
  setDeleteDialogOpen: (isOpen: boolean) => void;
  selectedNavgroup: AdminNavgroup | null;
  setSelectedNavgroup: (navgroup: AdminNavgroup | null) => void;
}

const AdminNavgroupContext = createContext<AdminNavgroupContextType | undefined>(undefined);

export const useAdminNavgroupContext = () => {
  const context = useContext(AdminNavgroupContext);
  if (!context) {
    throw new Error('useAdminNavgroupContext must be used within an AdminNavgroupProvider');
  }
  return context;
};

interface AdminNavgroupProviderProps {
  children: ReactNode;
}

const AdminNavgroupProvider: React.FC<AdminNavgroupProviderProps> = ({ children }) => {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNavgroup, setSelectedNavgroup] = useState<AdminNavgroup | null>(null);

  return (
    <AdminNavgroupContext.Provider
      value={{
        isCreateDialogOpen,
        setCreateDialogOpen,
        isEditDialogOpen,
        setEditDialogOpen,
        isDeleteDialogOpen,
        setDeleteDialogOpen,
        selectedNavgroup,
        setSelectedNavgroup,
      }}
    >
      {children}
    </AdminNavgroupContext.Provider>
  );
};

export default AdminNavgroupProvider;
