interface EventMap {
  'query-devtools:test': {
    title: string
    description: string
  }
  'query-devtools:init': {
    title: string
    description: string
  }
  'query-devtools:query': {
    title: string
    description: string
  }
}

type QueryPlugin = {
  on: (
    event: 'test',
    cb: (payload: { type: string; payload: { title: string; description: string } }) => void
  ) => () => void
  emit: (event: 'test', payload: { title: string; description: string }) => void
}

let queryPluginPromise: Promise<QueryPlugin> | null = null

export function getQueryPlugin(): Promise<QueryPlugin> {
  if (!import.meta.env.DEV) {
    return Promise.reject(new Error('query plugin is only available in dev'))
  }

  if (queryPluginPromise) return queryPluginPromise

  queryPluginPromise = import('@tanstack/devtools-event-client').then(({ EventClient }) => {
    class QueryDevtoolsClient extends EventClient<EventMap> {
      constructor() {
        super({
          pluginId: 'query-devtools',
          debug: false,
        })
      }
    }

    const plugin = new QueryDevtoolsClient() as unknown as QueryPlugin

    plugin.emit('test', {
      title: 'Query Devtools',
      description: 'A plugin for query debugging',
    })

    return plugin
  })

  return queryPluginPromise
}
