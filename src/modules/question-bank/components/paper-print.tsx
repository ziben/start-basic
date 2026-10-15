import type { QuestionContent } from '../shared/domain'
import { QuestionContentView } from './question-content'

export type PaperPrintData = {
  title: string
  instructions: string
  sections: {
    title: string
    items: {
      id?: string
      questionId: string
      snapshot: QuestionContent
      score: number
      answerLines: number
    }[]
  }[]
}

export const paperPrintStyles = `
  #qb-print-portal { display: none; }
  @media print {
    @page { size: A4; margin: 15mm; }
    html, body { height: auto !important; overflow: visible !important; background: white !important; }
    body > *:not(#qb-print-portal) { display: none !important; }
    #qb-print-portal { display: block !important; color: black; }
    #qb-print { width: 100%; max-width: none; padding: 0; font-size: 11pt; }
    .qb-print-item { break-inside: avoid; }
    .qb-answer-sheet { break-before: page; }
    .qb-paper img { max-height: 90mm; }
  }
`

export function PrintPaper({
  paper,
  answers,
  atEnd,
  id,
}: {
  paper: PaperPrintData
  answers: boolean
  atEnd: boolean
  id: string
}) {
  let questionNumber = 0
  const totalCents = paper.sections
    .flatMap((section) => section.items)
    .reduce((sum, item) => sum + Math.round(item.score * 100), 0)
  return (
    <article id={id} className='qb-paper mx-auto max-w-4xl space-y-6 bg-white p-6 text-black sm:p-10'>
      <header className='space-y-3 text-center'>
        <h1 className='text-2xl font-bold'>{paper.title}</h1>
        <p className='flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm'>
          <span>姓名：____________</span>
          <span>日期：____________</span>
          <span>总分：{(totalCents / 100).toFixed(2)}</span>
        </p>
        {paper.instructions && <p className='text-left text-sm whitespace-pre-wrap'>{paper.instructions}</p>}
      </header>
      {paper.sections.map((section, sectionIndex) => (
        <section key={sectionIndex} className='space-y-5'>
          <h2 className='text-lg font-bold'>{section.title}</h2>
          {section.items.map((item) => (
            <div key={item.id ?? item.questionId} className='qb-print-item space-y-3'>
              <p className='font-semibold'>
                {++questionNumber}.（{item.score} 分）
              </p>
              <QuestionContentView content={item.snapshot} answers={answers && !atEnd} />
              {(!answers || atEnd) &&
                Array.from({ length: item.answerLines }, (_, index) => (
                  <div key={index} className='h-7 border-b border-dotted border-gray-300' />
                ))}
            </div>
          ))}
        </section>
      ))}
      {answers && atEnd && (
        <section className='qb-answer-sheet space-y-5'>
          <h2 className='text-xl font-bold'>参考答案与解析</h2>
          {paper.sections
            .flatMap((section) => section.items)
            .map((item, index) => (
              <div key={item.id ?? item.questionId} className='qb-print-item space-y-2'>
                <h3 className='font-semibold'>第 {index + 1} 题</h3>
                <QuestionContentView content={item.snapshot} answers />
              </div>
            ))}
        </section>
      )}
    </article>
  )
}
