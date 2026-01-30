import { useNavigate, useLocation, useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { authClient } from '~/modules/auth/shared/lib/auth-client'
import { authQueryKeys, userQueryKeys } from '~/shared/lib/query-keys'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const router = useRouter()
  const queryClient = useQueryClient()

  const handleSignOut = async (): Promise<void> => {
    await authClient.signOut()
    queryClient.setQueryData(userQueryKeys.current, null)
    queryClient.setQueryData(authQueryKeys.session, null)
    queryClient.invalidateQueries({ queryKey: userQueryKeys.current })
    queryClient.invalidateQueries({ queryKey: authQueryKeys.session })
    await router.invalidate()
    // Preserve current location for redirect after sign-in
    const currentPath = location.href
    navigate({
      to: '/sign-in',
      search: { redirect: currentPath },
      replace: true,
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='退出'
      desc='确定要退出登录吗？您需要重新登录才能访问您的账户。'
      confirmText='退出'
      cancelBtnText='取消'
      destructive
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}




