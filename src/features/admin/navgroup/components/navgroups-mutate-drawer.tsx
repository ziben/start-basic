import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
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
import { SelectDropdown } from '@/components/select-dropdown'
import { type AdminNavgroup, createNavgroupSchema, updateNavgroupSchema } from '../data/schema'
import {
  useCreateNavgroup,
  useUpdateNavgroup,
} from '~/hooks/useNavgroupApi'
import type { CreateNavgroupData } from '../data/schema'
import { toast } from 'sonner'
import { useTranslation } from '~/hooks/useTranslation'

type NavGroupsMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: AdminNavgroup
}

// Use the existing create/update schemas for validation
const formSchema = createNavgroupSchema
type NavGroupForm = z.infer<typeof formSchema>

export function NavGroupsMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: NavGroupsMutateDrawerProps) {
  const isUpdate = !!currentRow
  const createMutation = useCreateNavgroup()
  const updateMutation = useUpdateNavgroup()
  const { t } = useTranslation()

  const form = useForm<NavGroupForm>({
    resolver: zodResolver(formSchema),
    defaultValues: currentRow
      ? {
          title: currentRow.title,
          orderIndex: currentRow.orderIndex,
          roles: currentRow.roleNavGroups
            ? currentRow.roleNavGroups.map((r) => r.role)
            : undefined,
        }
      : {
          title: '',
          orderIndex: undefined,
          roles: undefined,
        },
  })

  const onSubmit = (data: NavGroupForm) => {
    const payload = {
      title: data.title,
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
      } catch (err: any) {
        console.error(err)
        toast.error(isUpdate ? t('admin.navgroup.toast.updateError.title') : t('admin.navgroup.toast.createError.title'))
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
            {isUpdate
              ? t('admin.navgroup.dialogs.edit.title')
              : t('admin.navgroup.dialogs.create.title')}
          </SheetTitle>
          <SheetDescription>
            {isUpdate
              ? t('admin.navgroup.dialogs.edit.desc')
              : t('admin.navgroup.dialogs.create.desc')}
            {" "}
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
              name='orderIndex'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.navgroup.fields.orderIndex') || 'Order Index'}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      placeholder='Optional order index'
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
              name='roles'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.navgroup.fields.roles') || 'Roles'}</FormLabel>
                  <FormControl>
                    <div className='flex flex-wrap gap-2'>
                      {['admin', 'editor', 'viewer'].map((role) => (
                        <label key={role} className='inline-flex items-center space-x-2'>
                          <input
                            type='checkbox'
                            checked={(field.value || []).includes(role)}
                            onChange={(e) => {
                              const cur = Array.isArray(field.value) ? field.value : []
                              if (e.target.checked) {
                                field.onChange([...cur, role])
                              } else {
                                field.onChange(cur.filter((r) => r !== role))
                              }
                            }}
                          />
                          <span className='text-sm'>{role}</span>
                        </label>
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
