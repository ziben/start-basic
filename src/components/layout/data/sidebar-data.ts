import {
  Construction,
  LayoutDashboard,
  Monitor,
  Bug,
  ListTodo,
  FileX,
  HelpCircle,
  Lock,
  Bell,
  Package,
  Palette,
  ServerOff,
  Settings,
  Wrench,
  UserCog,
  UserX,
  Users,
  MessagesSquare,
  ShieldCheck,
  Building,
  Key,
  List,
  Mail,
  Menu,
  UserCheck,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
} from 'lucide-react'
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
          icon: LayoutDashboard,
        },
        {
          title: t('navigation.tasks'),
          url: '/tasks',
          icon: ListTodo,
        },
        {
          title: t('navigation.apps'),
          url: '/apps',
          icon: Package,
        },
        {
          title: t('navigation.chats'),
          url: '/chats',
          badge: '3',
          icon: MessagesSquare,
        },
        {
          title: t('navigation.users'),
          url: '/users',
          icon: Users,
        },
      ],
    },
    {
      title: t('sidebar.pages'),
      items: [
        {
          title: t('auth.authentication'),
          icon: ShieldCheck,
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
          icon: Bug,
          items: [
            {
              title: t('errors.unauthorized'),
              url: '/errors/unauthorized',
              icon: Lock,
            },
            {
              title: t('errors.forbidden'),
              url: '/errors/forbidden',
              icon: UserX,
            },
            {
              title: t('errors.notFound'),
              url: '/errors/not-found',
              icon: FileX,
            },
            {
              title: t('errors.serverError'),
              url: '/errors/internal-server-error',
              icon: ServerOff,
            },
            {
              title: t('errors.serviceUnavailable'),
              url: '/errors/maintenance-error',
              icon: Construction,
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
          icon: Settings,
          items: [
            {
              title: t('settings.profile.title'),
              url: '/settings',
              icon: UserCog,
            },
            {
              title: t('settings.account.title'),
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: t('settings.appearance.title'),
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: t('settings.notifications.title'),
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: t('settings.display.title'),
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: t('navigation.helpCenter'),
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
    {
      title: t('sidebar.system'),
      items: [
        {
          title: t('sidebar.User'),
          url: '/admin/user',
          icon: Users,
        },
        {
          title: t('sidebar.Session'),
          url: '/admin/session',
          icon: Lock,
        },
        {
          title: t('sidebar.Account'),
          url: '/admin/account',
          icon: UserCog,
        },
        {
          title: t('sidebar.Verification'),
          url: '/admin/verification',
          icon: ShieldCheck,
        },
        {
          title: t('sidebar.Organization'),
          url: '/admin/organization',
          icon: Building,
        },
        {
          title: t('sidebar.Member'),
          url: '/admin/member',
          icon: Users,
        },
        {
          title: t('sidebar.Invitation'),
          url: '/admin/invitation',
          icon: Mail,
        },
        {
          title: t('sidebar.NavGroup'),
          url: '/admin/navgroup',
          icon: List,
        },
        {
          title: t('sidebar.NavItem'),
          url: '/admin/navitem',
          icon: Menu,
        },
        {
          title: t('sidebar.RoleNavGroup'),
          url: '/admin/rolenavgroup',
          icon: Key,
        },
        {
          title: t('sidebar.UserRoleNavGroup'),
          url: '/admin/userrolenavgroup',
          icon: UserCheck,
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
