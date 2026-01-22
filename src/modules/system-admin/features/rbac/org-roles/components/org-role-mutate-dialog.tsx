import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createOrganizationRoleFn, updateOrganizationRoleFn } from "@/modules/system-admin/shared/server-fns/organization-role.fn"
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

const formSchema = z.object({
  role: z.string().min(1, "角色标识不能为空"),
  displayName: z.string().min(1, "显示名称不能为空"),
  description: z.string().optional(),
  templateRoleId: z.string().optional(),
  copyTemplatePermissions: z.boolean().default(true),
  isActive: z.boolean().default(true),
})

type FormValues = z.infer<typeof formSchema>

export function OrgRoleMutateDialog() {
  const { mutateDialog, closeMutateDialog, tableUrl } = useOrgRolesContext()
  const queryClient = useQueryClient()
  const { data: templates = [] } = useOrgRoleTemplatesQuery()

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
      toast.success("组织角色创建成功")
      closeMutateDialog()
    },
    onError: (error: Error) => {
      toast.error("创建失败", { description: error.message })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (!role?.id) throw new Error("角色ID不存在")
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
      toast.success("组织角色更新成功")
      closeMutateDialog()
    },
    onError: (error: Error) => {
      toast.error("更新失败", { description: error.message })
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
          <DialogTitle>{isEdit ? "编辑组织角色" : "新增组织角色"}</DialogTitle>
          <DialogDescription>
            为当前组织创建或修改特定的角色实例
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
                    <FormLabel>从模板选择 (可选)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择一个预设模板" />
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
                    <FormDescription>基于模板可快速同步基础权限</FormDescription>
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
                  <FormLabel>角色标识</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例如: admin, manager" disabled={isEdit} />
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
                  <FormLabel>显示名称</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例如: 行政主管" />
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
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="角色职责描述" />
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
                    <FormLabel>启用状态</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeMutateDialog}>
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEdit ? "保存" : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}