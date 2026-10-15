import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createPortal } from 'react-dom'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { paperInputSchema, type QuestionContent } from '../shared/domain'
import { useQuestionPaper, useQuestionBankCommand, type QuestionRow } from '../shared/hooks'
import type { getQuestionPaperFn } from '../shared/server-fns/question-bank.fn'
import { Field, selectClass, TextField } from './fields'
import { paperPrintStyles, PrintPaper } from './paper-print'
import { QuestionContentView } from './question-content'

type Paper = Awaited<ReturnType<typeof getQuestionPaperFn>>
type DraftItem = {
  id?: string
  questionId: string
  sourceBankName: string
  snapshot: QuestionContent
  score: number
  answerLines: number
}
type DraftSection = { title: string; items: DraftItem[] }
export type PaperDraft = {
  id?: string
  version?: number
  title: string
  instructions: string
  sections: DraftSection[]
}
export function paperFromSelection(questions: QuestionRow[]): PaperDraft {
  return {
    title: '新建练习卷',
    instructions: '',
    sections: [
      {
        title: '一、试题',
        items: questions.map((question) => ({
          questionId: question.id,
          snapshot: question.content,
          sourceBankName: question.bank.name,
          score: 5,
          answerLines: 3,
        })),
      },
    ],
  }
}
export function draftFromPaper(paper: Paper): PaperDraft {
  return {
    id: paper.id,
    version: paper.version,
    title: paper.title,
    instructions: paper.instructions,
    sections: paper.sections.map((section) => ({
      title: section.title,
      items: section.items.map((item) => ({
        id: item.id,
        questionId: item.sourceQuestionId,
        snapshot: item.snapshot,
        sourceBankName: item.sourceBankName,
        score: item.score,
        answerLines: item.answerLines,
      })),
    })),
  }
}
function reorder<T>(values: T[], from: number, to: number): T[] {
  if (to < 0 || to >= values.length) return values
  const result = [...values]
  const [value] = result.splice(from, 1)
  result.splice(to, 0, value)
  return result
}
export function PaperEditor({ initial, onCancel }: { initial: PaperDraft; onCancel: () => void }) {
  const [draft, setDraft] = useState(initial)
  const [printMode, setPrintMode] = useState<'student' | 'teacher'>('student')
  const [atEnd, setAtEnd] = useState(true)
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState('')
  const [printing, setPrinting] = useState(false)
  const [dirty, setDirty] = useState(false)
  const mutation = useQuestionBankCommand()
  const navigate = useNavigate()
  function change(next: PaperDraft) {
    setDraft(next)
    setDirty(true)
  }
  function updateSection(index: number, patch: Partial<DraftSection>) {
    change({
      ...draft,
      sections: draft.sections.map((section, offset) => (offset === index ? { ...section, ...patch } : section)),
    })
  }
  function updateItem(sectionIndex: number, itemIndex: number, patch: Partial<DraftItem>) {
    updateSection(sectionIndex, {
      items: draft.sections[sectionIndex].items.map((item, offset) =>
        offset === itemIndex ? { ...item, ...patch } : item
      ),
    })
  }
  async function save(event: FormEvent) {
    event.preventDefault()
    const parsed = paperInputSchema.safeParse(draft)
    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => issue.message).join('；'))
      return
    }
    setError('')
    try {
      const result = await mutation.mutateAsync({ action: 'savePaper', ...parsed.data })
      if (result.id) {
        setDirty(false)
        await navigate({ to: '/question-bank/papers/$paperId', params: { paperId: result.id } })
      }
    } catch {
      /* Keep unsaved edits available for correction. */
    }
  }
  async function print() {
    setPrinting(true)
    try {
      await document.fonts.ready
      await Promise.all(
        Array.from(document.querySelectorAll<HTMLImageElement>('#qb-print img')).map((image) => image.decode())
      )
      window.print()
    } catch {
      setError('图片未能完整加载，请检查预览后重试打印')
    } finally {
      setPrinting(false)
    }
  }
  return (
    <div className='space-y-5'>
      <style>{paperPrintStyles}</style>
      <Card className='qb-editor'>
        <CardHeader>
          <CardTitle>{draft.id ? '编辑试卷' : '组卷编辑'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className='space-y-4'>
            <TextField
              label='试卷标题'
              value={draft.title}
              onChange={(title) => change({ ...draft, title })}
              required
              maxLength={150}
            />
            <Field label='考试说明'>
              <Textarea
                rows={3}
                maxLength={2000}
                value={draft.instructions}
                onChange={(event) => change({ ...draft, instructions: event.target.value })}
              />
            </Field>
            <p className='text-sm text-muted-foreground'>
              已有题目使用保存时的内容快照。分值支持两位小数，答题留白按行设置。
            </p>
            {draft.sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className='space-y-3 rounded-md border p-4'>
                <div className='flex flex-wrap items-end gap-2'>
                  <div className='min-w-40 flex-1'>
                    <TextField
                      label={`第 ${sectionIndex + 1} 分组`}
                      value={section.title}
                      onChange={(title) => updateSection(sectionIndex, { title })}
                      required
                    />
                  </div>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    aria-label={`分组 ${sectionIndex + 1} 上移`}
                    disabled={sectionIndex === 0}
                    onClick={() =>
                      change({ ...draft, sections: reorder(draft.sections, sectionIndex, sectionIndex - 1) })
                    }
                  >
                    上移
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    aria-label={`分组 ${sectionIndex + 1} 下移`}
                    disabled={sectionIndex === draft.sections.length - 1}
                    onClick={() =>
                      change({ ...draft, sections: reorder(draft.sections, sectionIndex, sectionIndex + 1) })
                    }
                  >
                    下移
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    disabled={section.items.length > 0 || draft.sections.length === 1}
                    onClick={() =>
                      change({ ...draft, sections: draft.sections.filter((_, index) => index !== sectionIndex) })
                    }
                  >
                    移除空分组
                  </Button>
                </div>
                {section.items.map((item, itemIndex) => (
                  <div key={item.id ?? item.questionId} className='space-y-3 rounded-md bg-muted/40 p-3'>
                    <details>
                      <summary className='cursor-pointer text-sm font-medium'>
                        第 {itemIndex + 1} 题 · {item.sourceBankName} · 展开题目
                      </summary>
                      <div className='mt-3'>
                        <QuestionContentView content={item.snapshot} answers />
                      </div>
                    </details>
                    <div className='flex flex-wrap items-end gap-3'>
                      <div className='w-24'>
                        <Field label='分值'>
                          <Input
                            type='number'
                            min={0}
                            max={9999}
                            step='0.01'
                            value={item.score}
                            onChange={(event) =>
                              updateItem(sectionIndex, itemIndex, { score: Number(event.target.value) })
                            }
                          />
                        </Field>
                      </div>
                      <div className='w-24'>
                        <Field label='留白行数'>
                          <Input
                            type='number'
                            min={0}
                            max={30}
                            value={item.answerLines}
                            onChange={(event) =>
                              updateItem(sectionIndex, itemIndex, { answerLines: Number(event.target.value) })
                            }
                          />
                        </Field>
                      </div>
                      <div className='min-w-32'>
                        <Field label='所属分组'>
                          <select
                            className={selectClass}
                            value={sectionIndex}
                            onChange={(event) => {
                              const target = Number(event.target.value)
                              change({
                                ...draft,
                                sections: draft.sections.map((entry, index) => ({
                                  ...entry,
                                  items:
                                    index === sectionIndex
                                      ? entry.items.filter((_, offset) => offset !== itemIndex)
                                      : index === target
                                        ? [...entry.items, item]
                                        : entry.items,
                                })),
                              })
                            }}
                          >
                            {draft.sections.map((entry, index) => (
                              <option key={index} value={index}>
                                {entry.title}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        aria-label={`题目 ${itemIndex + 1} 上移`}
                        disabled={itemIndex === 0}
                        onClick={() =>
                          updateSection(sectionIndex, { items: reorder(section.items, itemIndex, itemIndex - 1) })
                        }
                      >
                        上移
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        aria-label={`题目 ${itemIndex + 1} 下移`}
                        disabled={itemIndex === section.items.length - 1}
                        onClick={() =>
                          updateSection(sectionIndex, { items: reorder(section.items, itemIndex, itemIndex + 1) })
                        }
                      >
                        下移
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant='ghost'
                        onClick={() =>
                          updateSection(sectionIndex, {
                            items: section.items.filter((_, index) => index !== itemIndex),
                          })
                        }
                      >
                        移出试卷
                      </Button>
                    </div>
                  </div>
                ))}
                {!section.items.length && <p className='text-sm text-muted-foreground'>可将其他分组的题目移入此处</p>}
              </div>
            ))}
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                variant='outline'
                disabled={draft.sections.length >= 20}
                onClick={() =>
                  change({
                    ...draft,
                    sections: [...draft.sections, { title: `第 ${draft.sections.length + 1} 部分`, items: [] }],
                  })
                }
              >
                添加分组
              </Button>
              <Button type='submit' disabled={mutation.isPending}>
                {mutation.isPending ? '正在保存…' : '保存试卷'}
              </Button>
              <Button type='button' variant='ghost' onClick={onCancel}>
                返回题库
              </Button>
            </div>
            {error && (
              <p role='alert' className='text-sm text-destructive'>
                {error}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className='flex flex-wrap items-center gap-3 pt-5'>
          <Button variant='outline' onClick={() => setPreview(!preview)}>
            {preview ? '收起打印预览' : '打印预览'}
          </Button>
          <Field label='打印版本'>
            <select
              className={selectClass}
              value={printMode}
              onChange={(event) => setPrintMode(event.target.value as typeof printMode)}
            >
              <option value='student'>学生版（隐藏答案）</option>
              <option value='teacher'>教师答案版</option>
            </select>
          </Field>
          {printMode === 'teacher' && (
            <Field label='答案位置'>
              <select
                className={selectClass}
                value={atEnd ? 'end' : 'inline'}
                onChange={(event) => setAtEnd(event.target.value === 'end')}
              >
                <option value='end'>集中放在卷末</option>
                <option value='inline'>附在每题后</option>
              </select>
            </Field>
          )}
          <Button disabled={!draft.id || dirty || printing || !preview} onClick={() => void print()}>
            {printing ? '准备打印…' : '打印 / 另存 PDF'}
          </Button>
          {(!draft.id || dirty) && <span className='text-xs text-muted-foreground'>先保存试卷，再预览和打印。</span>}
        </CardContent>
      </Card>
      {preview && (
        <>
          <PrintPaper id='qb-preview' paper={draft} answers={printMode === 'teacher'} atEnd={atEnd} />
          {createPortal(
            <div id='qb-print-portal'>
              <PrintPaper id='qb-print' paper={draft} answers={printMode === 'teacher'} atEnd={atEnd} />
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  )
}

export function QuestionPaperPage({ paperId }: { paperId: string }) {
  const navigate = useNavigate()
  const query = useQuestionPaper(paperId)
  return (
    <AppHeaderMain>
      {query.isPending && <p role='status'>正在加载试卷…</p>}
      {query.error && (
        <p role='alert' className='text-destructive'>
          {query.error.message}
        </p>
      )}
      {query.data && (
        <PaperEditor
          key={`${query.data.id}-${query.data.version}`}
          initial={draftFromPaper(query.data)}
          onCancel={() => void navigate({ to: '/question-bank', search: { view: 'papers' } })}
        />
      )}
    </AppHeaderMain>
  )
}
