import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TranslationsDialogs } from '~/modules/admin/features/i18n/translation/components/translations-dialogs'
import { NavGroupsDialogs } from '~/modules/navigation/admin/navgroup/components/navgroups-dialogs'

const mocks = vi.hoisted(() => ({
  remove: vi.fn(),
  setOpen: vi.fn(),
  setCurrentRow: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  isPending: false,
}))
vi.mock('sonner', () => ({ toast: { error: mocks.error, success: mocks.success } }))
vi.mock('~/modules/admin/shared/hooks/use-translation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('~/modules/navigation/shared/navgroup/hooks/use-navgroup-api', () => ({
  useDeleteNavgroup: () => ({ mutateAsync: mocks.remove, isPending: mocks.isPending }),
}))
vi.mock('~/modules/admin/features/i18n/translation/hooks/use-translation-api', () => ({
  useDeleteTranslation: () => ({ mutateAsync: mocks.remove, isPending: mocks.isPending }),
}))
vi.mock('~/modules/navigation/admin/navgroup/components/navgroups-provider', () => ({
  useNavGroups: () => ({
    open: 'delete',
    currentRow: { id: 'record-1', title: 'Menu group' },
    setOpen: mocks.setOpen,
    setCurrentRow: mocks.setCurrentRow,
  }),
}))
vi.mock('~/modules/admin/features/i18n/translation/components/translations-provider', () => ({
  useTranslations: () => ({
    open: 'delete',
    currentRow: { id: 'record-1', key: 'test.key' },
    setOpen: mocks.setOpen,
    setCurrentRow: mocks.setCurrentRow,
  }),
}))
vi.mock('~/modules/navigation/admin/navgroup/components/navgroups-mutate-drawer', () => ({
  NavGroupsMutateDrawer: () => null,
}))
vi.mock('~/modules/admin/features/i18n/translation/components/translations-mutate-drawer', () => ({
  TranslationsMutateDrawer: () => null,
}))

beforeEach(() => {
  vi.resetAllMocks()
  mocks.isPending = false
})
afterEach(cleanup)

describe.each([
  ['navigation groups', NavGroupsDialogs],
  ['translations', TranslationsDialogs],
] as const)('%s deletion', (_name, Dialogs) => {
  it('keeps the selected record and dialog open after a failed deletion', async () => {
    mocks.remove.mockRejectedValue(new Error('record is in use'))
    render(<Dialogs />)
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }))
    await waitFor(() => expect(mocks.error).toHaveBeenCalled())
    expect(mocks.error).toHaveBeenCalledWith(expect.any(String), { description: 'record is in use' })
    expect(mocks.setOpen).not.toHaveBeenCalled()
    expect(mocks.setCurrentRow).not.toHaveBeenCalled()
  })

  it('closes and clears the selected record only after success', async () => {
    mocks.remove.mockResolvedValue({ success: true })
    render(<Dialogs />)
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }))
    await waitFor(() => expect(mocks.setOpen).toHaveBeenCalledWith(null))
    expect(mocks.setCurrentRow).toHaveBeenCalledWith(null)
    expect(mocks.success).toHaveBeenCalledOnce()
  })

  it('disables confirmation and cancellation while deletion is pending', () => {
    mocks.isPending = true
    render(<Dialogs />)
    expect(screen.getByRole('button', { name: 'common.delete' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'common.buttons.cancel' })).toBeDisabled()
    expect(mocks.remove).not.toHaveBeenCalled()
  })
})
