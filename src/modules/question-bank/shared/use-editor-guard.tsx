import { useCallback, useRef, useState } from 'react'
import { useBlocker } from '@tanstack/react-router'
import { ConfirmDialog } from '~/components/confirm-dialog'

export function useEditorGuard(initialDirty = false) {
  const [dirty, setDirtyState] = useState(initialDirty)
  const dirtyRef = useRef(initialDirty)
  const [leaveAction, setLeaveAction] = useState<(() => void) | null>(null)
  const shouldBlock = useCallback(() => dirtyRef.current, [])
  const blocker = useBlocker({
    shouldBlockFn: shouldBlock,
    enableBeforeUnload: shouldBlock,
    withResolver: true,
  })
  function setDirty(value: boolean) {
    // Save handlers can navigate before React has rendered the clean state.
    dirtyRef.current = value
    setDirtyState(value)
  }
  function requestLeave(action: () => void) {
    if (dirtyRef.current) setLeaveAction(() => action)
    else action()
  }
  function cancelLeave() {
    blocker.reset?.()
    setLeaveAction(null)
  }
  function discard() {
    setDirty(false)
    if (blocker.status === 'blocked') blocker.proceed()
    else leaveAction?.()
    setLeaveAction(null)
  }
  return {
    dirty,
    setDirty,
    requestLeave,
    dialog: (
      <ConfirmDialog
        open={blocker.status === 'blocked' || !!leaveAction}
        onOpenChange={(open) => {
          if (!open) cancelLeave()
        }}
        title='放弃未保存的修改？'
        desc='当前内容尚未保存。离开后，未保存的内容将丢失。'
        cancelBtnText='继续编辑'
        confirmText='放弃修改并离开'
        destructive
        handleConfirm={discard}
      />
    ),
  }
}
