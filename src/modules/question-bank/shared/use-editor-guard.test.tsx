import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEditorGuard } from './use-editor-guard'

function Editor() {
  const { setDirty, dialog } = useEditorGuard()
  return (
    <>
      <button onClick={() => setDirty(true)}>Change</button>
      {dialog}
    </>
  )
}
async function setup() {
  const root = createRootRoute()
  const editor = createRoute({ getParentRoute: () => root, path: '/', component: Editor })
  const destination = createRoute({ getParentRoute: () => root, path: '/about', component: () => <p>Destination</p> })
  const router = createRouter({
    routeTree: root.addChildren([editor, destination]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  render(<RouterProvider router={router} />)
  await screen.findByRole('button', { name: 'Change' })
  return router
}

describe('editor navigation guard with the actual router', () => {
  it('allows clean navigation without confirmation', async () => {
    const router = await setup()
    void router.navigate({ to: '/about' })
    expect(await screen.findByText('Destination')).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
  it('blocks a dirty navigation, cancels it, then proceeds after confirmation', async () => {
    const router = await setup()
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    void router.navigate({ to: '/about' })
    await screen.findByRole('alertdialog')
    expect(router.state.location.pathname).toBe('/')
    fireEvent.click(screen.getByRole('button', { name: '继续编辑' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(router.state.location.pathname).toBe('/')
    void router.navigate({ to: '/about' })
    fireEvent.click(await screen.findByRole('button', { name: '放弃修改并离开' }))
    expect(await screen.findByText('Destination')).toBeInTheDocument()
  })
})
