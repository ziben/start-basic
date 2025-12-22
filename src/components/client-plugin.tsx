import { useEffect, useState } from 'react'
import { getQueryPlugin } from '@/plugin'

export default function ClientPlugin() {
  const [events, setEvents] = useState<Array<{ type: string; payload: { title: string; description: string } }>>([])
  const [plugin, setPlugin] = useState<Awaited<ReturnType<typeof getQueryPlugin>> | null>(null)

  useEffect(() => {
    if (!import.meta.env.DEV) return

    let active = true
    getQueryPlugin()
      .then((p) => {
        if (!active) return
        setPlugin(p)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!plugin) return

    const cleanup = plugin.on('test', (event) => {
      console.log('Received message in here:', event)
      setEvents((prev) => [...prev, event as any])
    })

    return cleanup
  }, [plugin])
  return (
    <div>
      <h1>Client Plugin Initialized</h1>
      <p>Devtools Client is connected.</p>
      <button
        className='rounded bg-blue-500 px-4 py-2 text-white'
        onClick={() => {
          console.log('Button clicked, emitting event')
          if (!plugin) return
          plugin.emit('test', {
            title: 'Button Clicked',
            description: 'This is a custom event triggered by the client plugin.',
          })
        }}
      >
        Click me
      </button>
      {events.map((event, i) => (
        <div key={i}>
          <h2>{event.payload.title}</h2>
          <p style={{ color: 'gray' }}>{event.payload.description}</p>
        </div>
      ))}
    </div>
  )
}
