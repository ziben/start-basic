import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '~/lib/api-client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SelectDropdown } from '@/components/select-dropdown'
import { getErrorMessage } from '~/lib/error-handler'
import { type AdminUsers } from '../data/schema'
import { ADMIN_USERS_QUERY_KEY } from '../hooks/use-admin-users-list-query'

type AdminUsersMutateDialogProps = {
  currentRow?: AdminUsers
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Email is required.'),
  password: z.string().optional().catch(''),
  username: z.string().optional().catch(''),
  role: z.enum(['admin', 'user']).catch('user'),
  banned: z.boolean().optional().catch(false),
  banReason: z.string().optional().catch(''),
  banExpires: z.string().optional().catch(''),
})

type AdminUserForm = z.infer<typeof formSchema>

export function AdminUsersMutateDialog({ currentRow, open, onOpenChange }: AdminUsersMutateDialogProps) {
  const isEdit = !!currentRow

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

  // Watch the banned field to conditionally show ban-related fields
  const banned = useWatch({
    control: form.control,
    name: 'banned',
  })

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (data: AdminUserForm) => {
      if (!data.password) {
        throw new Error('Password is required for new users')
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
      await queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
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
      await queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
      onOpenChange(false)
      form.reset()
    },
  })

  const onSubmit = (data: AdminUserForm) => {
    const promise = isEdit ? updateMutation.mutateAsync(data) : createMutation.mutateAsync(data)

    toast.promise(promise, {
      loading: isEdit ? 'Saving user...' : 'Creating user...',
      success: isEdit ? 'User saved successfully' : 'User created successfully',
      error: (error) => {
        return getErrorMessage(error)
      },
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the user here. ' : 'Create new user here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[26.25rem] overflow-y-auto py-1'>
          <Form {...form}>
            <form id='user-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 px-0.5'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter name' className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Email</FormLabel>
                    <FormControl>
                      <Input placeholder='user@example.com' className='col-span-4' {...field} disabled={isEdit} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {!isEdit ? (
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-end'>Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Set initial password'
                          className='col-span-4'
                          type='password'
                          autoComplete='off'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Username</FormLabel>
                    <FormControl>
                      <Input placeholder='username' className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Role</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Select role'
                      className='col-span-4'
                      items={[
                        { label: 'Admin', value: 'admin' },
                        { label: 'User', value: 'user' },
                      ]}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='banned'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Banned</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(v) => field.onChange(v === 'true')}
                        defaultValue={String(field.value)}
                        className='col-span-4 flex gap-4'
                      >
                        <FormItem className='flex items-center space-y-0 space-x-2'>
                          <FormControl>
                            <RadioGroupItem value='true' />
                          </FormControl>
                          <FormLabel className='font-normal'>Yes</FormLabel>
                        </FormItem>
                        <FormItem className='flex items-center space-y-0 space-x-2'>
                          <FormControl>
                            <RadioGroupItem value='false' />
                          </FormControl>
                          <FormLabel className='font-normal'>No</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {banned && (
                <>
                  <FormField
                    control={form.control}
                    name='banReason'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-end'>Ban Reason</FormLabel>
                        <FormControl>
                          <Input placeholder='reason (optional)' className='col-span-4' {...field} />
                        </FormControl>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='banExpires'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-end'>Ban Expires</FormLabel>
                        <FormControl>
                          <Input placeholder='2025-01-01T00:00:00.000Z' className='col-span-4' {...field} />
                        </FormControl>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='user-form' disabled={updateMutation.isPending || createMutation.isPending}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
