import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAdminNavItemContext } from '../context/admin-navitem-context';
import { useTranslation } from '~/hooks/useTranslation';

interface Props {
  navGroupId?: string;
}

const AdminNavItemPrimaryButtons: React.FC<Props> = ({ navGroupId }) => {
  const { t } = useTranslation();
  const { setCreateDialogOpen } = useAdminNavItemContext();

  return (
    <div className="flex items-center space-x-2">
      <Button 
        onClick={() => {
          // 在上下文中设置导航组ID
          setCreateDialogOpen(true);
        }}
      >
        <Plus className="mr-2 h-4 w-4" />
        {navGroupId 
          ? t('admin.navitem.buttons.createInGroup')
          : t('admin.navitem.buttons.create')}
      </Button>
    </div>
  );
};

export default AdminNavItemPrimaryButtons;
