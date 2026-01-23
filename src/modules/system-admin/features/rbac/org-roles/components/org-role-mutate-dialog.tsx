import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createOrganizationRoleFn, updateOrganizationRoleFn } from "@/modules/system-admin/shared/server-fns/organization-role.fn"
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { rbacOrgRolesQueryKeys } from '~/shared/lib/query-keys'
import { useOrgRolesContext } from "../context/org-roles-context"
import { useOrgRoleTemplatesQuery } from "../hooks/use-org-roles-queries"

export function OrgRoleMutateDialog() {
  const { t } = useTranslation()
  const { mutateDialog, closeMutateDialog, tableUrl } = useOrgRolesContext()
  const queryClient = useQueryClient()
  const { data: templates = [] } = useOrgRoleTemplatesQuery()

  const formSchema = z.object({
    role: z.string().min(1, t('admin.orgRole.validation.roleRequired')),
    displayName: z.string().min(1, t('admin.orgRole.validation.displayNameRequired')),
    description: z.string().optional(),
    templateRoleId: z.string().optional(),
    copyTemplatePermissions: z.boolean().default(true),
    isActive: z.boolean().default(true),
  })

  type FormValues = z.input<typeof formSchema>

  const organizationId = (tableUrl.columnFilters.find(f => f.id === "organizationId")?.value as string) || ""
  const role = mutateDialog.data
  const isEdit = !!role?.id

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "",
      displayName: "",
      description: "",
      templateRoleId: "",
      copyTemplatePermissions: true,
      isActive: true,
    },
  })

  useEffect(() => {
    if (mutateDialog.isOpen) {
      if (isEdit && role) {
        form.reset({
          role: role.role,
          displayName: role.displayName || "",
          description: role.description || "",
          templateRoleId: role.templateRoleId || "",
          copyTemplatePermissions: false,
          isActive: role.isActive,
        })
      } else {
        form.reset({
          role: "",
          displayName: "",
          description: "",
          templateRoleId: "",
          copyTemplatePermissions: true,
          isActive: true,
        })
      }
    }
  }, [mutateDialog.isOpen, isEdit, role, form])

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => createOrganizationRoleFn({ 
      data: { ...data, organizationId } 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacOrgRolesQueryKeys.all })
      toast.success(t('admin.orgRole.toast.createSuccess'))
      closeMutateDialog()
    },
    onError: (error: Error) => {
      toast.error(t('admin.orgRole.toast.createError'), { description: error.message })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (!role?.id) throw new Error(t('admin.orgRole.errors.missingId'))
      return updateOrganizationRoleFn({
        data: {
          id: role.id,
          displayName: data.displayName,
          description: data.description,
          isActive: data.isActive,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacOrgRolesQueryKeys.all })
      toast.success(t('admin.orgRole.toast.updateSuccess'))
      closeMutateDialog()
    },
    onError: (error: Error) => {
      toast.error(t('admin.orgRole.toast.updateError'), { description: error.message })
    },
  })

  const onSubmit = (data: FormValues) => {
    if (isEdit) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <Dialog open={mutateDialog.isOpen} onOpenChange={closeMutateDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('admin.orgRole.dialog.editTitle') : t('admin.orgRole.dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('admin.orgRole.dialog.desc')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEdit && (
              <FormField
                control={form.control}
                name="templateRoleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.orgRole.form.template')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.orgRole.form.templatePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.displayName} ({t.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t('admin.orgRole.form.templateHelp')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.orgRole.form.role')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('admin.orgRole.form.rolePlaceholder')} disabled={isEdit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.orgRole.form.displayName')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('admin.orgRole.form.displayNamePlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.orgRole.form.description')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder={t('admin.orgRole.form.descriptionPlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('admin.orgRole.form.active')}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeMutateDialog}>
                {t('common.buttons.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEdit ? t('common.buttons.save') : t('common.buttons.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}