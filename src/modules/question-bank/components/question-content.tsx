import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import type { QuestionContent, QuestionPart } from '../shared/domain'

type HtmlNode = { type: string; tagName?: string; properties?: Record<string, unknown>; children?: HtmlNode[] }
const mathElements = [
  'math',
  'mrow',
  'mi',
  'mn',
  'mo',
  'mtext',
  'mfrac',
  'msqrt',
  'mroot',
  'msup',
  'msub',
  'msubsup',
  'mover',
  'munder',
  'munderover',
  'mtable',
  'mtr',
  'mtd',
  'mspace',
  'mfenced',
  'menclose',
]
const allowedElements = [
  'p',
  'br',
  'strong',
  'em',
  'del',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'hr',
  'a',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  ...mathElements,
]
export function questionUrlTransform(url: string, key: string): string {
  if (key === 'src') return /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z\d+/=\s]+$/i.test(url) ? url : ''
  return defaultUrlTransform(url)
}
function sanitizeQuestionMarkup() {
  return (tree: HtmlNode) => {
    function walk(node: HtmlNode) {
      if (node.type === 'element') {
        const props = node.properties ?? {}
        const clean: Record<string, unknown> = {}
        if (node.tagName === 'img') {
          clean.src = questionUrlTransform(String(props.src ?? ''), 'src')
          clean.alt = String(props.alt ?? '')
          clean.title = String(props.title ?? '')
        } else if (node.tagName === 'a') {
          clean.href = questionUrlTransform(String(props.href ?? ''), 'href')
          clean.rel = 'noreferrer noopener'
        } else if (mathElements.includes(node.tagName ?? '')) {
          for (const attribute of ['display', 'mathvariant', 'stretchy', 'columnalign', 'rowalign', 'notation']) {
            const value = props[attribute]
            if (typeof value === 'string' && /^[a-z -]{1,60}$/i.test(value)) clean[attribute] = value
          }
        }
        node.properties = clean
      }
      node.children?.forEach(walk)
    }
    walk(tree)
  }
}
export function QuestionMarkdown({ content }: { content: string }) {
  return (
    <div className='qb-content space-y-2 break-words [&_img]:my-2 [&_img]:max-h-80 [&_img]:max-w-full [&_img]:object-contain [&_math]:text-lg [&_ol]:list-inside [&_ol]:list-decimal [&_ul]:list-inside [&_ul]:list-disc'>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw, sanitizeQuestionMarkup]}
        allowedElements={allowedElements}
        unwrapDisallowed={false}
        urlTransform={questionUrlTransform}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
function Part({ part, answers, number }: { part: QuestionPart | QuestionContent; answers: boolean; number?: number }) {
  return (
    <div className='space-y-2'>
      {number !== undefined && <p className='font-medium'>（{number}）</p>}
      <QuestionMarkdown content={part.stem} />
      {part.options.length > 0 && (
        <div className='grid gap-2 sm:grid-cols-2'>
          {part.options.map((option) => (
            <div key={option.key} className='flex gap-2'>
              <strong>{option.key}.</strong>
              <QuestionMarkdown content={option.text} />
            </div>
          ))}
        </div>
      )}
      {answers && (
        <div className='qb-answer border-l-2 border-emerald-600 pl-3 text-sm'>
          <p className='font-medium'>参考答案</p>
          <QuestionMarkdown content={part.answer || '未填写'} />
          {part.explanation && (
            <>
              <p className='mt-2 font-medium'>解析</p>
              <QuestionMarkdown content={part.explanation} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
export function QuestionContentView({ content, answers = false }: { content: QuestionContent; answers?: boolean }) {
  return (
    <div className='space-y-4'>
      {content.type === 'COMPOSITE' ? (
        <>
          <QuestionMarkdown content={content.stem} />
          {content.children.map((child, index) => (
            <Part key={index} part={child} answers={answers} number={index + 1} />
          ))}
        </>
      ) : (
        <Part part={content} answers={answers} />
      )}
    </div>
  )
}
