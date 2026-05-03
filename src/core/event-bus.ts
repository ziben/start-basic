export type EventMap = Record<string, unknown>

export type EventHandler<TPayload> = (payload: TPayload) => void | Promise<void>

export type Unsubscribe = () => void

export interface EventBus<TEvents extends EventMap> {
  emit<TKey extends keyof TEvents>(type: TKey, payload: TEvents[TKey]): Promise<void>
  on<TKey extends keyof TEvents>(
    type: TKey,
    handler: EventHandler<TEvents[TKey]>
  ): Unsubscribe
  once<TKey extends keyof TEvents>(
    type: TKey,
    handler: EventHandler<TEvents[TKey]>
  ): Unsubscribe
  clear<TKey extends keyof TEvents>(type?: TKey): void
}

type UnknownHandler = (payload: unknown) => void | Promise<void>

export function createEventBus<TEvents extends EventMap>(): EventBus<TEvents> {
  const handlers = new Map<keyof TEvents, Set<UnknownHandler>>()

  const removeHandler = <TKey extends keyof TEvents>(
    type: TKey,
    handler: UnknownHandler
  ): void => {
    const eventHandlers = handlers.get(type)
    if (!eventHandlers) return

    eventHandlers.delete(handler)

    if (eventHandlers.size === 0) {
      handlers.delete(type)
    }
  }

  return {
    async emit(type, payload) {
      const eventHandlers = handlers.get(type)
      if (!eventHandlers) return

      await Promise.all(Array.from(eventHandlers, (handler) => handler(payload)))
    },

    on(type, handler) {
      const wrappedHandler: UnknownHandler = (payload) =>
        handler(payload as TEvents[typeof type])

      const eventHandlers = handlers.get(type) ?? new Set<UnknownHandler>()
      eventHandlers.add(wrappedHandler)
      handlers.set(type, eventHandlers)

      return () => removeHandler(type, wrappedHandler)
    },

    once(type, handler) {
      let unsubscribe: Unsubscribe = () => undefined

      unsubscribe = this.on(type, async (payload) => {
        unsubscribe()
        await handler(payload)
      })

      return unsubscribe
    },

    clear(type) {
      if (type === undefined) {
        handlers.clear()
        return
      }

      handlers.delete(type)
    },
  }
}
