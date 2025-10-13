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
import { type AdminUsers } from '../data/schema'

type AdminUsersMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: AdminUsers
}

const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().min(1, 'Email is required.'),
  role: z.string().min(1, 'Please select a role.'),
  banned: z.boolean().optional().catch(false),
  image: z.string().optional().catch(''),
  banReason: z.string().optional().catch(''),
  banExpires: z.string().optional().catch(''),
  username: z.string().optional().catch(''),
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
    role: row?.role ?? '',
    banned: row?.banned ?? false,
    image: row?.image ?? '',
    banReason: row?.banReason ?? '',
    banExpires: row?.banExpires ? String(row.banExpires) : '',
    username: row?.username ?? '',
  })

  const form = useForm<AdminUserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(currentRow),
  })

  const onSubmit = (data: AdminUserForm) => {
    // do something with the form data
    onOpenChange(false)
    form.reset()
    showSubmittedData(data)
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
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Enter a title' />
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
                  <FormLabel>Status</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Select dropdown'
                    items={[
                      { label: 'In Progress', value: 'in progress' },
                      { label: 'Backlog', value: 'backlog' },
                      { label: 'Todo', value: 'todo' },
                      { label: 'Canceled', value: 'canceled' },
                      { label: 'Done', value: 'done' },
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
                  <FormLabel>Label</FormLabel>
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
                        <FormLabel className='font-normal'>True</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='false' />
                        </FormControl>
                        <FormLabel className='font-normal'>False</FormLabel>
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
                <FormItem className='relative'>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className='flex flex-col space-y-1'
                    >
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='high' />
                        </FormControl>
                        <FormLabel className='font-normal'>High</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='medium' />
                        </FormControl>
                        <FormLabel className='font-normal'>Medium</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='low' />
                        </FormControl>
                        <FormLabel className='font-normal'>Low</FormLabel>
                      </FormItem>
                    </RadioGroup>
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
          <Button form='tasks-form' type='submit'>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
