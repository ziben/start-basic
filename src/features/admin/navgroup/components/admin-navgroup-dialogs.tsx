import React from 'react';
import { useAdminNavgroupContext } from '../context/admin-navgroup-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminNavgroup, CreateNavgroupData, UpdateNavgroupData, createNavgroupSchema, updateNavgroupSchema } from '../data/schema';
import { useTranslation } from '~/hooks/useTranslation';
import { useCreateNavgroup, useDeleteNavgroup, useUpdateNavgroup } from '~/hooks/useNavgroupApi';
import { toast } from 'sonner';

const AdminNavgroupDialogs: React.FC = () => {
  const { t } = useTranslation();
  // 直接使用sonner的toast
  const {
    isCreateDialogOpen,
    setCreateDialogOpen,
    isEditDialogOpen,
    setEditDialogOpen,
    isDeleteDialogOpen,
    setDeleteDialogOpen,
    selectedNavgroup,
    setSelectedNavgroup,
  } = useAdminNavgroupContext();

  const createNavgroupMutation = useCreateNavgroup();
  const updateNavgroupMutation = useUpdateNavgroup();
  const deleteNavgroupMutation = useDeleteNavgroup();

  // 创建表单
  const createForm = useForm<CreateNavgroupData>({
    resolver: zodResolver(createNavgroupSchema),
    defaultValues: {
      title: '',
      orderIndex: 0,
      roles: ['user', 'admin'],
    },
  });

  // 编辑表单
  const editForm = useForm<UpdateNavgroupData>({
    resolver: zodResolver(updateNavgroupSchema),
    defaultValues: {
      title: '',
      orderIndex: 0,
      roles: [],
    },
  });

  // 当选中的导航组变更时，重置编辑表单
  React.useEffect(() => {
    if (selectedNavgroup) {
      // 提取角色
      const roles = selectedNavgroup.roleNavGroups
        ? selectedNavgroup.roleNavGroups.map(rng => rng.role)
        : [];
        
      editForm.reset({
        title: selectedNavgroup.title,
        orderIndex: selectedNavgroup.orderIndex,
        roles,
      });
    }
  }, [selectedNavgroup, editForm]);

  const handleCreateSubmit = async (data: CreateNavgroupData) => {
    try {
      await createNavgroupMutation.mutateAsync(data);
      
      toast.success(
        t('admin.common.createSuccess', { defaultMessage: '创建成功' }),
        { description: `导航组 "${data.title}" 已成功创建` }
      );
      
      setCreateDialogOpen(false);
      createForm.reset();
    } catch (error) {
      toast.error(
        t('admin.common.createError', { defaultMessage: '创建失败' }),
        { description: (error as Error).message }
      );
    }
  };

  const handleEditSubmit = async (data: UpdateNavgroupData) => {
    if (!selectedNavgroup) return;
    
    try {
      await updateNavgroupMutation.mutateAsync({
        id: selectedNavgroup.id,
        data,
      });
      
      toast.success(
        t('admin.common.updateSuccess', { defaultMessage: '更新成功' }),
        { description: `导航组 "${data.title ?? selectedNavgroup.title}" 已成功更新` }
      );
      
      setEditDialogOpen(false);
      setSelectedNavgroup(null);
    } catch (error) {
      toast.error(
        t('admin.common.updateError', { defaultMessage: '更新失败' }),
        { description: (error as Error).message }
      );
    }
  };

  const handleDelete = async () => {
    if (!selectedNavgroup) return;
    
    try {
      await deleteNavgroupMutation.mutateAsync(selectedNavgroup.id);
      
      toast.success(
        t('admin.common.deleteSuccess', { defaultMessage: '删除成功' }),
        { description: `导航组 "${selectedNavgroup.title}" 已成功删除` }
      );
      
      setDeleteDialogOpen(false);
      setSelectedNavgroup(null);
    } catch (error) {
      toast.error(
        t('admin.common.deleteError', { defaultMessage: '删除失败' }),
        { description: (error as Error).message }
      );
    }
  };

  return (
    <>
      {/* 创建导航组对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.navgroup.dialogs.create.title', { defaultMessage: '创建导航组' })}</DialogTitle>
            <DialogDescription>
              {t('admin.navgroup.dialogs.create.desc', { defaultMessage: '填写下面的表单创建一个新的导航组。' })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreateSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  {t('admin.navgroup.fields.title', { defaultMessage: '标题' })}
                </Label>
                <Input
                  id="title"
                  {...createForm.register('title')}
                  className="col-span-3"
                />
                {createForm.formState.errors.title && (
                  <p className="col-span-3 col-start-2 text-sm text-destructive">
                    {createForm.formState.errors.title.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="orderIndex" className="text-right">
                  {t('admin.navgroup.fields.orderIndex', { defaultMessage: '排序' })}
                </Label>
                <Input
                  id="orderIndex"
                  type="number"
                  {...createForm.register('orderIndex', { valueAsNumber: true })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createNavgroupMutation.isPending}>
                {createNavgroupMutation.isPending 
                  ? t('common.buttons.submitting', { defaultMessage: '提交中...' })
                  : t('common.buttons.submit', { defaultMessage: '提交' })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 编辑导航组对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.navgroup.dialogs.edit.title', { defaultMessage: '编辑导航组' })}</DialogTitle>
            <DialogDescription>
              {t('admin.navgroup.dialogs.edit.desc', { defaultMessage: '修改下面的表单更新导航组信息。' })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-title" className="text-right">
                  {t('admin.navgroup.fields.title', { defaultMessage: '标题' })}
                </Label>
                <Input
                  id="edit-title"
                  {...editForm.register('title')}
                  className="col-span-3"
                />
                {editForm.formState.errors.title && (
                  <p className="col-span-3 col-start-2 text-sm text-destructive">
                    {editForm.formState.errors.title.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-orderIndex" className="text-right">
                  {t('admin.navgroup.fields.orderIndex', { defaultMessage: '排序' })}
                </Label>
                <Input
                  id="edit-orderIndex"
                  type="number"
                  {...editForm.register('orderIndex', { valueAsNumber: true })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{t('common.buttons.save', { defaultMessage: '保存' })}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除导航组确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.navgroup.dialogs.delete.title', { defaultMessage: '确认删除' })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.navgroup.dialogs.delete.desc', { defaultMessage: '您确定要删除这个导航组吗？删除后无法恢复。' })}
              <div className="mt-2 font-medium text-destructive">{selectedNavgroup?.title}</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>  
              {t('common.buttons.cancel', { defaultMessage: '取消' })}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleteNavgroupMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteNavgroupMutation.isPending 
                ? t('common.buttons.deleting', { defaultMessage: '删除中...' })
                : t('common.buttons.delete', { defaultMessage: '删除' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminNavgroupDialogs;
