import { createFileRoute } from '@tanstack/react-router'
import { AdminNavigationPage } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/navigation')({
  component: AdminNavigationPage,
  validateSearch: (search: Record<string, unknown>) => {
    const tab = search.tab

    const pageRaw = search.page
    const pageSizeRaw = search.pageSize

    const page = typeof pageRaw === 'string' ? Number(pageRaw) : typeof pageRaw === 'number' ? pageRaw : undefined
    const pageSize =
      typeof pageSizeRaw === 'string' ? Number(pageSizeRaw) : typeof pageSizeRaw === 'number' ? pageSizeRaw : undefined

    return {
      tab: tab === 'groups' || tab === 'items' ? (tab as 'groups' | 'items') : 'groups',
      navGroupId: typeof search.navGroupId === 'string' ? search.navGroupId : undefined,
      filter: typeof search.filter === 'string' ? search.filter : undefined,
      title: typeof search.title === 'string' ? search.title : undefined,
      description: typeof search.description === 'string' ? search.description : undefined,
      page: Number.isFinite(page) ? page : undefined,
      pageSize: Number.isFinite(pageSize) ? pageSize : undefined,
    }
  },
})


