import type { NavGroup } from '~/components/layout/types'

export const adminNavigationGroups: NavGroup[] = [
  {
    title: '概览',
    items: [{ title: '系统概览', url: '/admin/dashboard', icon: 'LayoutDashboard' }],
  },
  {
    title: '系统配置',
    items: [
      { title: '系统设置', url: '/admin/system-config', icon: 'Settings' },
      { title: '菜单管理', url: '/admin/navigation', icon: 'Menu' },
      { title: '翻译管理', url: '/admin/translation', icon: 'Languages' },
    ],
  },
  {
    title: '用户与权限',
    items: [
      { title: '用户管理', url: '/admin/users', icon: 'Users' },
      { title: '账号管理', url: '/admin/account', icon: 'UserCog' },
      { title: '会话管理', url: '/admin/session', icon: 'Lock' },
      { title: '角色与模板', url: '/admin/rbac/roles', icon: 'Shield' },
      { title: '权限定义', url: '/admin/rbac/permissions', icon: 'Key' },
      { title: '角色菜单配置', url: '/admin/rolenavgroup', icon: 'Menu' },
    ],
  },
  {
    title: '组织管理',
    items: [
      { title: '组织列表', url: '/admin/organizations', icon: 'Building' },
      { title: '部门管理', url: '/admin/department', icon: 'Building' },
      { title: '组织成员', url: '/admin/members', icon: 'Users' },
      { title: '组织角色', url: '/admin/rbac/org-roles', icon: 'Shield' },
    ],
  },
  {
    title: '业务管理',
    items: [
      { title: 'AI 会话管理', url: '/admin/ai-chat', icon: 'Bot' },
      { title: '支付订单', url: '/admin/payment/orders', icon: 'CreditCard' },
    ],
  },
  {
    title: '健康管理',
    items: [
      { title: '体检报告', url: '/health/reports', icon: 'Activity' },
      { title: '人员档案', url: '/health/persons', icon: 'Users' },
      { title: '跨期比较', url: '/health/compare', icon: 'Activity' },
    ],
  },
  {
    title: '运维与审计',
    items: [
      { title: '日志与审计', url: '/admin/log', icon: 'ScrollText' },
      { title: '模块诊断', url: '/admin/modules', icon: 'Boxes' },
    ],
  },
]
