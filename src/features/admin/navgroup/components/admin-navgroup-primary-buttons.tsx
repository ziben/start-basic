import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAdminNavgroupContext } from '../context/admin-navgroup-context';
import { useTranslation } from '~/hooks/useTranslation';

const AdminNavgroupPrimaryButtons: React.FC = () => {
  const { t } = useTranslation();
  const { setCreateDialogOpen } = useAdminNavgroupContext();

  return (
    <div className="flex items-center space-x-2">
      <Button onClick={() => setCreateDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t('common.buttons.create', { defaultMessage: '新建导航组' })}
      </Button>
    </div>
  );
};

export default AdminNavgroupPrimaryButtons;
