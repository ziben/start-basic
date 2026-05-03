import { defineModule } from '~/core/module-registry'
import { auth, getAuth } from './shared/lib/auth'

export const authModule = defineModule({
  key: 'auth',
  version: '1.0.0',
  betterAuth: {
    serverPluginIds: [
      'bearer',
      'username',
      'organization',
      'admin',
      'wechat-oauth',
      'user-created-hooks',
    ],
    clientPluginIds: [
      'username',
      'admin',
      'organization',
      'wechat-oauth',
    ],
  },
  exports: {
    runtime: {
      auth,
      getAuth,
    },
  },
})

export type AuthModule = typeof authModule
