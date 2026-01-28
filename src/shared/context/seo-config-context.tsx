import * as React from 'react'
import {
  DEFAULT_SEO_TEMPLATE_CONFIG,
  type SeoTemplateConfig,
} from '@/shared/utils/seo'

type SeoConfigContextValue = {
  config: SeoTemplateConfig
}

const SeoConfigContext = React.createContext<SeoConfigContextValue>({
  config: DEFAULT_SEO_TEMPLATE_CONFIG,
})

type SeoConfigProviderProps = {
  config: SeoTemplateConfig
  children: React.ReactNode
}

export function SeoConfigProvider({ config, children }: SeoConfigProviderProps): React.ReactElement {
  const value = React.useMemo<SeoConfigContextValue>(() => ({ config }), [config])
  return <SeoConfigContext.Provider value={value}>{children}</SeoConfigContext.Provider>
}

export function useSeoConfig(): SeoTemplateConfig {
  return React.useContext(SeoConfigContext).config
}
