import { lazy, Suspense, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ChatSettingsPanel = lazy(() =>
  import('./chat-settings-panel').then(({ ChatSettingsPanel }) => ({ default: ChatSettingsPanel }))
)

export function ChatSettings() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant='ghost'
        size='icon'
        title='AI 设置'
        aria-label='AI 设置'
        className='shrink-0'
        onClick={() => setOpen(true)}
      >
        <Settings2 className='h-4 w-4' />
      </Button>
      {open && (
        <Suspense fallback={null}>
          <ChatSettingsPanel onOpenChange={setOpen} />
        </Suspense>
      )}
    </>
  )
}
