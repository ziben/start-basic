import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
import { type AdminUsers } from '../data/schema'
import { apiClient } from '~/lib/api-client'

type AdminUsersMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: AdminUsers
}

const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email().min(1, 'Email is required.'),
  password: z.string().optional().catch(''),
  username: z.string().optional().catch(''),
  role: z.enum(['admin', 'user']).catch('user'),
  banned: z.boolean().optional().catch(false),
  banReason: z.string().optional().catch(''),
  banExpires: z.string().optional().catch(''),
})
type AdminUserForm = z.infer<typeof formSchema>

export function AdminUsersMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: AdminUsersMutateDrawerProps) {
  const isUpdate = !!currentRow
  // 将后端 row 转换为表单期望的默认值形状，避免 null/undefined 导致的类型不匹配
  const toFormValues = (row?: AdminUsers): AdminUserForm => ({
    name: row?.name ?? '',
    email: row?.email ?? '',
    password: '',
    username: row?.username ?? '',
    role: row?.role === 'admin' ? 'admin' : 'user',
    banned: row?.banned ?? false,
    banReason: row?.banReason ?? '',
    banExpires: row?.banExpires ? new Date(String(row.banExpires)).toISOString() : '',
  })

  const form = useForm<AdminUserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(currentRow),
  })

  const queryClient = useQueryClient()
  const createMutation = useMutation({
    mutationFn: async (data: AdminUserForm) => {
      if (!data.password) {
        throw new Error('Password is required')
      }

      return await apiClient.users.create({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
        username: data.username ? data.username : undefined,
        banned: data.banned,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onOpenChange(false)
      form.reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: AdminUserForm) => {
      if (!currentRow) {
        throw new Error('Missing current user')
      }

      return await apiClient.users.update(currentRow.id, {
        name: data.name,
        username: data.username ? data.username : null,
        role: data.role,
        banned: data.banned,
        banReason: data.banned ? (data.banReason ? data.banReason : null) : null,
        banExpires: data.banned ? (data.banExpires ? data.banExpires : null) : null,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onOpenChange(false)
      form.reset()
    },
  })

  const onSubmit = (data: AdminUserForm) => {
    const promise = isUpdate
      ? updateMutation.mutateAsync(data)
      : createMutation.mutateAsync(data)

    toast.promise(promise, {
      loading: isUpdate ? 'Saving user...' : 'Creating user...',
      success: isUpdate ? 'Saved' : 'Created',
      error: String,
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        form.reset(toFormValues(currentRow))
      }}
    >
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-start'>
          <SheetTitle>{isUpdate ? 'Update' : 'Create'} User</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Update the user by providing necessary info.'
              : 'Add a new user by providing necessary info.'}
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='tasks-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-6 overflow-y-auto px-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Enter name' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isUpdate} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isUpdate ? (
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} type='password' placeholder='Set initial password' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name='username'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='username' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='role'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Select role'
                    items={[
                      { label: 'Admin', value: 'admin' },
                      { label: 'User', value: 'user' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='banned'
              render={({ field }) => (
                <FormItem className='relative'>
                  <FormLabel>Banned</FormLabel>
                  <FormControl>
                    {/* RadioGroup / Radix expects string values for defaultValue; map boolean to strings */}
                    <RadioGroup
                      onValueChange={(v) => field.onChange(v === 'true')}
                      defaultValue={String(field.value)}
                      className='flex flex-col space-y-1'
                    >
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='true' />
                        </FormControl>
                        <FormLabel className='font-normal'>Yes</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='false' />
                        </FormControl>
                        <FormLabel className='font-normal'>No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='banReason'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ban Reason</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='reason (optional)' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='banExpires'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ban Expires (ISO datetime)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='2025-01-01T00:00:00.000Z (optional)' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>Close</Button>
          </SheetClose>
          <Button
            form='tasks-form'
            type='submit'
            disabled={updateMutation.isPending || createMutation.isPending}
          >
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
