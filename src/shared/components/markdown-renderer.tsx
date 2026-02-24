import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'

type MarkdownRendererProps = {
  content?: string | null
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps): React.ReactElement {
  if (!content) {
    return <span className='text-muted-foreground'>-</span>
  }

  return (
    <div className={className}>
      <ReactMarkdown 
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
