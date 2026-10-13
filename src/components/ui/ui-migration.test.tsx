import { createRef } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from './alert-dialog'
import { Button } from './button'
import { Calendar } from './calendar'
import { ChartContainer, ChartTooltipContent } from './chart'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from './dialog'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './sheet'
import { SidebarMenuSkeleton } from './sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('shadcn registry and Radix migration', () => {
  it('preserves asChild links, event handlers and forwarded refs', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const ref = createRef<HTMLAnchorElement>()

    render(
      <Button asChild size='xs' onClick={onClick}>
        <a href='#details' ref={ref}>
          Details
        </a>
      </Button>
    )

    const link = screen.getByRole('link', { name: 'Details' })
    expect(ref.current).toBe(link)
    expect(link.querySelector('button')).toBeNull()
    await user.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('keeps alert dialog cancel behavior when composed with Button', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent size='sm'>
          <AlertDialogTitle>Remove item?</AlertDialogTitle>
          <AlertDialogDescription>This removes the selected item.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel size='sm'>Keep item</AlertDialogCancel>
            <AlertDialogAction variant='destructive' size='sm' onClick={onAction}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Remove item?')
    await user.click(screen.getByRole('button', { name: 'Keep item' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(onAction).not.toHaveBeenCalled()
  })

  it('closes a dialog from its footer and restores trigger focus', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open details</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Details</DialogTitle>
          <DialogDescription>Item information.</DialogDescription>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    )

    const trigger = screen.getByRole('button', { name: 'Open details' })
    await user.click(trigger)
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Details')
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('supports Escape dismissal when the sheet close button is hidden', async () => {
    const user = userEvent.setup()
    render(
      <Sheet defaultOpen>
        <SheetContent showCloseButton={false}>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Update settings.</SheetDescription>
          <Button>Save settings</Button>
        </SheetContent>
      </Sheet>
    )

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('selects a day through the installed DayPicker 10 API', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const month = new Date(2026, 9, 1)
    render(<Calendar mode='single' defaultMonth={month} onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: /October 13th, 2026/ }))
    expect(onSelect.mock.calls[0]?.[0]).toEqual(new Date(2026, 9, 13))
    expect(screen.getByRole('grid')).toHaveClass('rdp-month_grid')
  })

  it.each([
    ['horizontal', 'vertical', 'row'],
    ['vertical', 'horizontal', 'column'],
  ] as const)(
    'preserves %s resizing and separator accessibility',
    (orientation, separatorOrientation, flexDirection) => {
      const { container } = render(
        <ResizablePanelGroup orientation={orientation}>
          <ResizablePanel defaultSize='50%'>First panel</ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize='50%'>Second panel</ResizablePanel>
        </ResizablePanelGroup>
      )

      expect(container.querySelector('[data-slot=resizable-panel-group]')).toHaveStyle({ flexDirection })
      expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', separatorOrientation)
    }
  )

  it('renders zero chart values and tolerates a tooltip item without a nested payload', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 320,
      height: 200,
      top: 0,
      left: 0,
      right: 320,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    render(
      <ChartContainer config={{ score: { label: 'Score', color: '#123456' } }}>
        <ChartTooltipContent
          active
          hideLabel
          payload={[{ graphicalItemId: 'score-series', dataKey: 'score', name: 'score', value: 0 }]}
        />
      </ChartContainer>
    )

    expect(screen.getByText('Score')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('supports keyboard navigation in vertical tabs', async () => {
    const user = userEvent.setup()
    render(
      <Tabs defaultValue='first' orientation='vertical'>
        <TabsList variant='line'>
          <TabsTrigger value='first'>First</TabsTrigger>
          <TabsTrigger value='second'>Second</TabsTrigger>
        </TabsList>
        <TabsContent value='first'>First content</TabsContent>
        <TabsContent value='second'>Second content</TabsContent>
      </Tabs>
    )

    await user.click(screen.getByRole('tab', { name: 'First' }))
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Second' })).toHaveAttribute('aria-selected', 'true'))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Second content')
  })

  it('preserves tooltips that do not have an external provider', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip>
        <TooltipTrigger asChild>
          <Button>Help</Button>
        </TooltipTrigger>
        <TooltipContent>Help text</TooltipContent>
      </Tooltip>
    )

    await user.hover(screen.getByRole('button', { name: 'Help' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Help text')
  })

  it('keeps sidebar skeleton output deterministic during server rendering', () => {
    const first = renderToStaticMarkup(<SidebarMenuSkeleton showIcon />)
    const second = renderToStaticMarkup(<SidebarMenuSkeleton showIcon />)
    expect(first).toBe(second)
    expect(first).toContain('--skeleton-width:70%')
  })
})
