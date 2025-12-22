import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { IconPicker } from '~/components/icon-picker'
import { useNavgroups } from '~/hooks/useNavgroupApi'
import { useCreateNavitem, useUpdateNavitem, useDeleteNavitem } from '~/hooks/useNavitemApi'
import { useTranslation } from '~/hooks/useTranslation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdminNavItemContext } from '../context/admin-navitem-context'
import { CreateNavItemData, UpdateNavItemData, createNavItemSchema, updateNavItemSchema } from '../data/schema'

// 创建导航项对话框组件
const CreateNavItemDialog = () => {
  const { t } = useTranslation()
  // 直接使用sonner的toast

  const { isCreateDialogOpen, setCreateDialogOpen, navGroupId } = useAdminNavItemContext()

  // 获取导航组列表
  const { data: navgroups = [] } = useNavgroups('ADMIN')

  // 创建导航项的mutation
  const createNavitemMutation = useCreateNavitem()

  // 创建表单
  const toCreateFormValues = (navGroupId?: string): CreateNavItemData => ({
    title: '',
    url: '',
    icon: '',
    badge: '',
    isCollapsible: false,
    navGroupId: navGroupId ?? '',
    orderIndex: 0,
  })

  const createForm = useForm<CreateNavItemData>({
    resolver: zodResolver(createNavItemSchema),
    defaultValues: toCreateFormValues(navGroupId),
  })

  // 重置表单并关闭对话框
  const handleClose = () => {
    createForm.reset()
    setCreateDialogOpen(false)
  }

  // 处理表单提交
  const onSubmit = async (data: CreateNavItemData) => {
    try {
      await createNavitemMutation.mutateAsync(data)
      toast.success(t('admin.navitem.toast.createSuccess.title'), {
        description: t('admin.navitem.toast.createSuccess.description'),
      })
      handleClose()
    } catch (error) {
      toast.error(t('admin.navitem.toast.createError.title'), { description: String(error) })
    }
  }

  return (
    <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.navitem.dialogs.create.title')}</DialogTitle>
          <DialogDescription>{t('admin.navitem.dialogs.create.desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={createForm.handleSubmit(onSubmit)}>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='title' className='text-right'>
                {t('admin.navitem.fields.title')}
              </Label>
              <Input id='title' {...createForm.register('title')} className='col-span-3' />
              {createForm.formState.errors.title && (
                <p className='text-destructive col-span-3 col-start-2 text-sm'>
                  {createForm.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='url' className='text-right'>
                {t('admin.navitem.fields.url')}
              </Label>
              <Input id='url' {...createForm.register('url')} className='col-span-3' />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='icon' className='text-right'>
                {t('admin.navitem.fields.icon')}
              </Label>
              <div className='col-span-3'>
                <IconPicker
                  value={createForm.watch('icon')}
                  onValueChange={(value) => createForm.setValue('icon', value)}
                  className='w-full'
                />
              </div>
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='badge' className='text-right'>
                {t('admin.navitem.fields.badge')}
              </Label>
              <Input id='badge' {...createForm.register('badge')} className='col-span-3' />
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='navGroupId' className='text-right'>
                {t('admin.navitem.fields.navGroupId')}
              </Label>
              <Select
                defaultValue={navGroupId ?? ''}
                onValueChange={(value) => createForm.setValue('navGroupId', value)}
              >
                <SelectTrigger className='col-span-3'>
                  <SelectValue placeholder={t('admin.navitem.fields.navGroupIdPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {navgroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {createForm.formState.errors.navGroupId && (
                <p className='text-destructive col-span-3 col-start-2 text-sm'>
                  {createForm.formState.errors.navGroupId.message}
                </p>
              )}
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='orderIndex' className='text-right'>
                {t('admin.navitem.fields.orderIndex')}
              </Label>
              <Input
                id='orderIndex'
                type='number'
                {...createForm.register('orderIndex', { valueAsNumber: true })}
                className='col-span-3'
              />
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='isCollapsible' className='text-right'>
                {t('admin.navitem.fields.isCollapsible')}
              </Label>
              <div className='col-span-3 flex items-center space-x-2'>
                <Checkbox
                  id='isCollapsible'
                  checked={createForm.watch('isCollapsible')}
                  onCheckedChange={(checked) => createForm.setValue('isCollapsible', checked as boolean)}
                />
                <Label htmlFor='isCollapsible'>{t('admin.navitem.fields.isCollapsibleDesc')}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleClose}>
              {t('common.buttons.cancel', { defaultMessage: '取消' })}
            </Button>
            <Button type='submit' disabled={createNavitemMutation.isPending}>
              {createNavitemMutation.isPending
                ? t('common.buttons.saving', { defaultMessage: '保存中...' })
                : t('common.buttons.save', { defaultMessage: '保存' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// 编辑导航项对话框组件
const EditNavItemDialog = () => {
  const { t } = useTranslation()
  // 直接使用sonner的toast

  const { isEditDialogOpen, setEditDialogOpen, selectedNavItem, setSelectedNavItem } = useAdminNavItemContext()

  // 获取导航组列表
  const { data: navgroups = [] } = useNavgroups()

  // 更新导航项的mutation
  const updateNavitemMutation = useUpdateNavitem()

  // 编辑表单
  const editForm = useForm<UpdateNavItemData>({
    resolver: zodResolver(updateNavItemSchema),
    defaultValues: {
      title: '',
      url: '',
      icon: '',
      badge: '',
      isCollapsible: false,
      navGroupId: '',
      orderIndex: 0,
    },
  })

  // 当选中的导航项变更时，重置表单
  useEffect(() => {
    if (selectedNavItem) {
      const toEditFormValues = (row: typeof selectedNavItem): UpdateNavItemData => ({
        title: row.title,
        url: row.url ?? '',
        icon: row.icon ?? '',
        badge: row.badge ?? '',
        isCollapsible: row.isCollapsible ?? false,
        navGroupId: row.navGroupId,
        orderIndex: row.orderIndex ?? 0,
        parentId: row.parentId ?? undefined,
      })

      editForm.reset(toEditFormValues(selectedNavItem))
    }
  }, [selectedNavItem, editForm])

  // 处理关闭编辑对话框
  const handleClose = () => {
    editForm.reset()
    setEditDialogOpen(false)
    setSelectedNavItem(null)
  }

  // 处理表单提交
  const onSubmit = async (data: UpdateNavItemData) => {
    if (!selectedNavItem) return

    try {
      await updateNavitemMutation.mutateAsync({
        id: selectedNavItem.id,
        data,
      })
      toast.success(t('admin.navitem.toast.updateSuccess.title'), {
        description: t('admin.navitem.toast.updateSuccess.description'),
      })
      handleClose()
    } catch (error) {
      toast.error(t('admin.navitem.toast.updateError.title'), { description: String(error) })
    }
  }

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.navitem.dialogs.edit.title')}</DialogTitle>
          <DialogDescription>{t('admin.navitem.dialogs.edit.desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={editForm.handleSubmit(onSubmit)}>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='title' className='text-right'>
                {t('admin.navitem.fields.title')}
              </Label>
              <Input id='title' {...editForm.register('title')} className='col-span-3' />
              {editForm.formState.errors.title && (
                <p className='text-destructive col-span-3 col-start-2 text-sm'>
                  {editForm.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='url' className='text-right'>
                {t('admin.navitem.fields.url')}
              </Label>
              <Input id='url' {...editForm.register('url')} className='col-span-3' />
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='icon' className='text-right'>
                {t('admin.navitem.fields.icon')}
              </Label>
              <div className='col-span-3'>
                <IconPicker
                  value={editForm.watch('icon')}
                  onValueChange={(value) => editForm.setValue('icon', value)}
                  className='w-full'
                />
              </div>
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='badge' className='text-right'>
                {t('admin.navitem.fields.badge')}
              </Label>
              <Input id='badge' {...editForm.register('badge')} className='col-span-3' />
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='navGroupId' className='text-right'>
                {t('admin.navitem.fields.navGroupId')}
              </Label>
              <Select
                defaultValue={selectedNavItem?.navGroupId ?? ''}
                onValueChange={(value) => editForm.setValue('navGroupId', value)}
              >
                <SelectTrigger className='col-span-3'>
                  <SelectValue placeholder={t('admin.navitem.fields.navGroupIdPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {navgroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editForm.formState.errors.navGroupId && (
                <p className='text-destructive col-span-3 col-start-2 text-sm'>
                  {editForm.formState.errors.navGroupId.message}
                </p>
              )}
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='orderIndex' className='text-right'>
                {t('admin.navitem.fields.orderIndex')}
              </Label>
              <Input
                id='orderIndex'
                type='number'
                {...editForm.register('orderIndex', { valueAsNumber: true })}
                className='col-span-3'
              />
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='isCollapsible' className='text-right'>
                {t('admin.navitem.fields.isCollapsible')}
              </Label>
              <div className='col-span-3 flex items-center space-x-2'>
                <Checkbox
                  id='isCollapsible'
                  checked={editForm.watch('isCollapsible')}
                  onCheckedChange={(checked) => editForm.setValue('isCollapsible', checked as boolean)}
                />
                <Label htmlFor='isCollapsible'>{t('admin.navitem.fields.isCollapsibleDesc')}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleClose}>
              {t('common.buttons.cancel', { defaultMessage: '取消' })}
            </Button>
            <Button type='submit' disabled={updateNavitemMutation.isPending}>
              {updateNavitemMutation.isPending
                ? t('common.buttons.saving', { defaultMessage: '保存中...' })
                : t('common.buttons.save', { defaultMessage: '保存' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// 删除导航项对话框组件
const DeleteNavItemDialog = () => {
  const { t } = useTranslation()
  // 直接使用sonner的toast

  const { isDeleteDialogOpen, setDeleteDialogOpen, selectedNavItem, setSelectedNavItem } = useAdminNavItemContext()

  // 删除导航项的mutation
  const deleteNavitemMutation = useDeleteNavitem()

  // 处理关闭对话框
  const handleClose = () => {
    setDeleteDialogOpen(false)
    setSelectedNavItem(null)
  }

  // 处理删除
  const handleDelete = async () => {
    if (!selectedNavItem) return

    try {
      await deleteNavitemMutation.mutateAsync({
        id: selectedNavItem.id,
        navGroupId: selectedNavItem.navGroupId,
      })
      toast.success(t('admin.navitem.toast.deleteSuccess.title'), {
        description: t('admin.navitem.toast.deleteSuccess.description'),
      })
      handleClose()
    } catch (error) {
      toast.error(t('admin.navitem.toast.deleteError.title'), { description: String(error) })
    }
  }

  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.navitem.dialogs.delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.navitem.dialogs.delete.desc', {
              defaultMessage: '您确定要删除此导航项吗？此操作无法撤销。',
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.buttons.cancel', { defaultMessage: '取消' })}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteNavitemMutation.isPending}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {deleteNavitemMutation.isPending
              ? t('common.buttons.deleting', { defaultMessage: '删除中...' })
              : t('common.buttons.delete', { defaultMessage: '删除' })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// 主组件，包含所有对话框
const AdminNavItemDialogs: React.FC = () => {
  return (
    <>
      <CreateNavItemDialog />
      <EditNavItemDialog />
      <DeleteNavItemDialog />
    </>
  )
}

export default AdminNavItemDialogs
