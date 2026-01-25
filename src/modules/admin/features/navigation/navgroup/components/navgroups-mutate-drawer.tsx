import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useCreateNavgroup, useUpdateNavgroup } from '~/modules/admin/shared/hooks/use-navgroup-api'
import { useAllRoles } from '~/modules/admin/shared/hooks/use-role-api'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { type AdminNavgroup, createNavgroupSchema } from '../data/schema'
import type { CreateNavgroupData } from '../data/schema'

type NavGroupsMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: AdminNavgroup
}

const formSchema = createNavgroupSchema

type NavGroupForm = z.infer<typeof formSchema>

export function NavGroupsMutateDrawer({ open, onOpenChange, currentRow }: NavGroupsMutateDrawerProps) {
  const isUpdate = !!currentRow
  const createMutation = useCreateNavgroup()
  const updateMutation = useUpdateNavgroup()
  const { data: roles = [] } = useAllRoles()
  const { t } = useTranslation()

  const form = useForm<NavGroupForm>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: currentRow
      ? {
          title: currentRow.title,
          scope: currentRow.scope,
          orderIndex: currentRow.orderIndex,
          roles: currentRow.roleNavGroups ? currentRow.roleNavGroups.map((r: any) => r.roleName) : undefined,
        }
      : {
          title: '',
          scope: 'APP',
          orderIndex: undefined,
          roles: undefined,
        },
  })

  const onSubmit = (data: NavGroupForm) => {
    const payload = {
      title: data.title,
      scope: data.scope,
      orderIndex: data.orderIndex,
      roles: data.roles,
    }

    ;(async () => {
      try {
        if (isUpdate && currentRow) {
          await updateMutation.mutateAsync({ id: currentRow.id, data: payload })
          toast.success(t('admin.navgroup.toast.updateSuccess.title'))
        } else {
          await createMutation.mutateAsync(payload as CreateNavgroupData)
          toast.success(t('admin.navgroup.toast.createSuccess.title'))
        }
        onOpenChange(false)
        form.reset()
      } catch (err) {
        console.error(err)
        toast.error(
          isUpdate ? t('admin.navgroup.toast.updateError.title') : t('admin.navgroup.toast.createError.title')
        )
      }
    })()
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        form.reset()
      }}
    >
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-start'>
          <SheetTitle>
            {isUpdate ? t('admin.navgroup.dialogs.edit.title') : t('admin.navgroup.dialogs.create.title')}
          </SheetTitle>
          <SheetDescription>
            {isUpdate ? t('admin.navgroup.dialogs.edit.desc') : t('admin.navgroup.dialogs.create.desc')}{' '}
            {t('common.next') /* small hint: use existing common key for flow */}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='navgroups-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-6 overflow-y-auto px-4'
          >
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.navgroup.fields.title') || 'Title'}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Enter a title' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='scope'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>范围</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className='flex gap-4'>
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='APP' id='scope-app' />
                        <label htmlFor='scope-app' className='text-sm'>
                          APP
                        </label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='ADMIN' id='scope-admin' />
                        <label htmlFor='scope-admin' className='text-sm'>
                          ADMIN
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='orderIndex'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.navgroup.fields.orderIndex') || 'Order Index'}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      placeholder='可选排序索引'
                      onChange={(e) => {
                        const v = e.target.value
                        field.onChange(v === '' ? undefined : Number(v))
                      }}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='roleName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.navgroup.fields.roles') || 'Roles'}</FormLabel>
                  <FormControl>
                    <div className='flex flex-wrap gap-4'>
                      {roles.map((role: any) => (
                        <div key={role.id} className='flex items-center space-x-2'>
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={(field.value || []).includes(role.name)}
                            onCheckedChange={(checked) => {
                              const cur = Array.isArray(field.value) ? field.value : []
                              if (checked) {
                                field.onChange([...cur, role.name])
                              } else {
                                field.onChange(cur.filter((r) => r !== role.name))
                              }
                            }}
                          />
                          <label
                            htmlFor={`role-${role.id}`}
                            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                          >
                            {role.displayName || role.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>{t('common.cancel')}</Button>
          </SheetClose>
          <Button form='navgroups-form' type='submit'>
            {t('common.save')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}






