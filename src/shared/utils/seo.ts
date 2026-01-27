export const seo = ({
  title,
  description,
  keywords,
  image,
}: {
  title: string
  description?: string
  image?: string
  keywords?: string
}): Array<Record<string, unknown>> => {
  const tags = [
    { title },
    { name: 'description', content: description },
    { name: 'keywords', content: keywords },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:creator', content: '@tannerlinsley' },
    { name: 'twitter:site', content: '@tannerlinsley' },
    { name: 'og:type', content: 'website' },
    { name: 'og:title', content: title },
    { name: 'og:description', content: description },
    ...(image
      ? [
          { name: 'twitter:image', content: image },
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'og:image', content: image },
        ]
      : []),
  ]

  return tags
}

export type SeoTemplateVars = {
  appName: string
  appDesc?: string
  pageTitle?: string
  pageDesc?: string
}

export type SeoTemplateConfig = {
  appName: string
  appDesc?: string
  titleTemplate: string
  descriptionTemplate?: string
}

export const DEFAULT_SEO_TEMPLATE_CONFIG: SeoTemplateConfig = {
  appName: 'Zi Start',
  appDesc: 'Zi Start.',
  titleTemplate: '{{pageTitle}} | {{appName}}',
  descriptionTemplate: '{{pageDesc}} · {{appName}}',
}

export const renderSeoTemplate = (template: string, vars: SeoTemplateVars): string => {
  return template.replaceAll(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    const value = (vars as Record<string, unknown>)[key]
    return typeof value === 'string' ? value : ''
  })
}

export const composeSeoTitle = (
  input: { pageTitle?: string },
  config: SeoTemplateConfig = DEFAULT_SEO_TEMPLATE_CONFIG
): string => {
  const pageTitle = (input.pageTitle ?? '').trim()
  if (!pageTitle) return config.appName
  return renderSeoTemplate(config.titleTemplate, { appName: config.appName, pageTitle })
}

export const composeSeoDescription = (
  input: { pageDesc?: string },
  config: SeoTemplateConfig = DEFAULT_SEO_TEMPLATE_CONFIG
): string | undefined => {
  const pageDesc = (input.pageDesc ?? '').trim()
  if (!pageDesc) return config.appDesc
  if (!config.descriptionTemplate) return pageDesc
  const rendered = renderSeoTemplate(config.descriptionTemplate, {
    appName: config.appName,
    appDesc: config.appDesc,
    pageDesc,
  })
  return rendered.trim() || config.appDesc
}
