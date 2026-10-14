import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { RoleNavGroupManageDialog } from './role-navgroup-manage-dialog'

const mocks = vi.hoisted(() => ({
  groups: vi.fn(),
  role: vi.fn(),
  assign: vi.fn(),
  refetch: vi.fn(),
}))

vi.mock('~/modules/admin/shared/hooks/use-translation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('~/modules/navigation/shared/navgroup/hooks/use-navgroup-api', () => ({
  useNavgroups: mocks.groups,
}))
vi.mock('~/modules/rbac/system-roles/hooks/use-role-api', () => ({
  useRole: mocks.role,
  useAssignRoleNavGroups: () => ({ mutate: mocks.assign, isPending: false }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.groups.mockReturnValue({
    data: [{ id: 'group-1', title: 'Group one', scope: 'ADMIN' }],
    isLoading: false,
    isFetching: false,
    refetch: mocks.refetch,
  })
  mocks.role.mockReturnValue({
    data: { id: 'role-1', name: 'Editor', navGroupLinks: [{ navGroupId: 'group-1' }] },
    isFetching: false,
    refetch: mocks.refetch,
  })
})
afterEach(cleanup)

it('blocks saving when loading the existing assignment fails and allows retry', () => {
  mocks.role.mockReturnValue({ error: new Error('role unavailable'), isFetching: false, refetch: mocks.refetch })
  render(<RoleNavGroupManageDialog roleId='role-1' open onOpenChange={vi.fn()} />)
  expect(screen.getByRole('alert').textContent).toContain('role unavailable')
  expect(screen.getByRole('button', { name: 'admin.rolenavgroup.manage.save' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: '重试' }))
  expect(mocks.refetch).toHaveBeenCalledTimes(2)
  expect(mocks.assign).not.toHaveBeenCalled()
})

it('initializes selection from the refreshed role rather than stale cached assignment', () => {
  mocks.role.mockReturnValue({
    data: { id: 'role-1', name: 'Editor', navGroupLinks: [] },
    isFetching: true,
    refetch: mocks.refetch,
  })
  const props = { roleId: 'role-1', open: true, onOpenChange: vi.fn() }
  const view = render(<RoleNavGroupManageDialog {...props} />)
  expect(screen.getByRole('button', { name: 'admin.rolenavgroup.manage.save' })).toBeDisabled()
  mocks.role.mockReturnValue({
    data: { id: 'role-1', name: 'Editor', navGroupLinks: [{ navGroupId: 'group-1' }] },
    isFetching: false,
    refetch: mocks.refetch,
  })
  view.rerender(<RoleNavGroupManageDialog {...props} />)
  expect(screen.getByRole('checkbox')).toBeChecked()
  fireEvent.click(screen.getByRole('button', { name: 'admin.rolenavgroup.manage.save' }))
  expect(mocks.assign).toHaveBeenCalledWith({ id: 'role-1', navGroupIds: ['group-1'] }, expect.any(Object))
})

it('retains the draft and leaves the dialog open when saving fails', () => {
  const onOpenChange = vi.fn()
  mocks.assign.mockImplementation((_input, callbacks) => callbacks.onError(new Error('save failed')))
  render(<RoleNavGroupManageDialog roleId='role-1' open onOpenChange={onOpenChange} />)
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: 'admin.rolenavgroup.manage.save' }))
  expect(screen.getByRole('checkbox')).not.toBeChecked()
  expect(onOpenChange).not.toHaveBeenCalled()
  expect(mocks.assign).toHaveBeenCalledWith({ id: 'role-1', navGroupIds: [] }, expect.any(Object))
})
