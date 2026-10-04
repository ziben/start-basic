import { expect, it, vi } from 'vitest'
const getRoles = vi.hoisted(() => vi.fn())
vi.mock('../../server-fns/rbac.fn', () => ({ getRolesFn: getRoles }))
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => options,
  useMutation: vi.fn(), useQueryClient: vi.fn(),
}))
import { useAllRoles } from './use-role-api'

it('loads all role pages without exceeding the server page limit', async () => {
  getRoles.mockResolvedValueOnce({ items: [{ id: 'a' }], pageCount: 2 })
    .mockResolvedValueOnce({ items: [{ id: 'b' }], pageCount: 2 })
  const options = useAllRoles() as unknown as { queryFn: () => Promise<unknown> }
  expect(await options.queryFn()).toEqual([{ id: 'a' }, { id: 'b' }])
  expect(getRoles.mock.calls).toEqual([
    [{ data: { page: 1, pageSize: 100 } }], [{ data: { page: 2, pageSize: 100 } }],
  ])
})
