import {
  IconBarrierBlock,
  IconBrowserCheck,
  IconBug,
  IconChecklist,
  IconError404,
  IconHelp,
  IconLayoutDashboard,
  IconLock,
  IconLockAccess,
  IconMessages,
  IconNotification,
  IconPackages,
  IconPalette,
  IconServerOff,
  IconSettings,
  IconTool,
  IconUserCog,
  IconUserOff,
  IconUsers,
  IconShieldCheck,
  IconBuilding,
  IconMail,
  IconList,
  IconMenu,
  IconKey,
  IconUserCheck,
} from '@tabler/icons-react'
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react'
import { type SidebarData } from '../types'

// 这个文件不能直接使用hooks，因为它不是组件
// 所以我们创建一个函数来生成带有翻译的侧边栏数据
export const createSidebarData = (t: (key: string) => string): SidebarData => ({
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Shadcn 管理系统',
      logo: Command,
      plan: 'Vite + ShadcnUI',
    },
    {
      name: 'Acme 公司',
      logo: GalleryVerticalEnd,
      plan: '企业版',
    },
    {
      name: 'Acme 集团',
      logo: AudioWaveform,
      plan: '创业版',
    },
  ],
  navGroups: [
    {
      title: t('sidebar.general'),
      items: [
        {
          title: t('navigation.dashboard'),
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: t('navigation.tasks'),
          url: '/tasks',
          icon: IconChecklist,
        },
        {
          title: t('navigation.apps'),
          url: '/apps',
          icon: IconPackages,
        },
        {
          title: t('navigation.chats'),
          url: '/chats',
          badge: '3',
          icon: IconMessages,
        },
        {
          title: t('navigation.users'),
          url: '/users',
          icon: IconUsers,
        },
      ],
    },
    {
      title: t('sidebar.pages'),
      items: [
        {
          title: t('auth.authentication'),
          icon: IconLockAccess,
          items: [
            {
              title: t('auth.signIn'),
              url: '/sign-in',
            },
            {
              title: t('auth.twoColumn'),
              url: '/sign-in-2',
            },
            {
              title: t('auth.signUp'),
              url: '/sign-up',
            },
            {
              title: t('auth.forgotPassword'),
              url: '/forgot-password',
            },
            {
              title: t('auth.otp'),
              url: '/otp',
            },
          ],
        },
        {
          title: t('errors.errorPages'),
          icon: IconBug,
          items: [
            {
              title: t('errors.unauthorized'),
              url: '/401',
              icon: IconLock,
            },
            {
              title: t('errors.forbidden'),
              url: '/403',
              icon: IconUserOff,
            },
            {
              title: t('errors.notFound'),
              url: '/404',
              icon: IconError404,
            },
            {
              title: t('errors.serverError'),
              url: '/500',
              icon: IconServerOff,
            },
            {
              title: t('errors.serviceUnavailable'),
              url: '/503',
              icon: IconBarrierBlock,
            },
          ],
        },
      ],
    },
    {
      title: t('sidebar.others'),
      items: [
        {
          title: t('navigation.settings'),
          icon: IconSettings,
          items: [
            {
              title: t('settings.profile.title'),
              url: '/settings',
              icon: IconUserCog,
            },
            {
              title: t('settings.account.title'),
              url: '/settings/account',
              icon: IconTool,
            },
            {
              title: t('settings.appearance.title'),
              url: '/settings/appearance',
              icon: IconPalette,
            },
            {
              title: t('settings.notifications.title'),
              url: '/settings/notifications',
              icon: IconNotification,
            },
            {
              title: t('settings.display.title'),
              url: '/settings/display',
              icon: IconBrowserCheck,
            },
          ],
        },
        {
          title: t('navigation.helpCenter'),
          url: '/help-center',
          icon: IconHelp,
        },
      ],
    },
    {
      title: t('sidebar.system'),
      items: [
        {
          title: t('sidebar.User'),
          url: '/admin/user',
          icon: IconUsers,
        },
        {
          title: t('sidebar.Session'),
          url: '/admin/session',
          icon: IconLock,
        },
        {
          title: t('sidebar.Account'),
          url: '/admin/account',
          icon: IconUserCog,
        },
        {
          title: t('sidebar.Verification'),
          url: '/admin/verification',
          icon: IconShieldCheck,
        },
        {
          title: t('sidebar.Organization'),
          url: '/admin/organization',
          icon: IconBuilding,
        },
        {
          title: t('sidebar.Member'),
          url: '/admin/member',
          icon: IconUsers,
        },
        {
          title: t('sidebar.Invitation'),
          url: '/admin/invitation',
          icon: IconMail,
        },
        {
          title: t('sidebar.NavGroup'),
          url: '/admin/navgroup',
          icon: IconList,
        },
        {
          title: t('sidebar.NavItem'),
          url: '/admin/navitem',
          icon: IconMenu,
        },
        {
          title: t('sidebar.RoleNavGroup'),
          url: '/admin/rolenavgroup',
          icon: IconKey,
        },
        {
          title: t('sidebar.UserRoleNavGroup'),
          url: '/admin/userrolenavgroup',
          icon: IconUserCheck,
        },
      ],
    },
  ],
})

// 导出一个空的初始数据结构，将在组件中填充
export const sidebarData: SidebarData = {
  user: {
    name: '',
    email: '',
    avatar: '',
  },
  teams: [],
  navGroups: [],
}
