import { useState, type FormEvent } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import {
  blankQuestion,
  questionContentSchema,
  questionTypes,
  stageLabels,
  statusLabels,
  type QuestionContent,
  type QuestionPart,
} from '../shared/domain'
import { useQuestionBankCommand, type Bank, type QuestionRow } from '../shared/hooks'
import { Field, MarkupField, selectClass, TextField } from './fields'
import { QuestionContentView } from './question-content'

function PartEditor({
  part,
  onChange,
  withStem = true,
}: {
  part: QuestionPart
  onChange: (value: QuestionPart) => void
  withStem?: boolean
}) {
  const choice = part.type === 'SINGLE' || part.type === 'MULTIPLE'
  return (
    <div className='space-y-4'>
      {withStem && (
        <MarkupField label='小题题干' value={part.stem} onChange={(stem) => onChange({ ...part, stem })} required />
      )}
      {choice && (
        <div className='space-y-2'>
          <p className='text-sm font-medium'>选项</p>
          {part.options.map((option, index) => (
            <div key={option.key} className='flex items-start gap-2'>
              <span className='pt-2 text-sm font-semibold'>{option.key}</span>
              <div className='min-w-0 flex-1'>
                <MarkupField
                  label={`选项 ${option.key}`}
                  value={option.text}
                  onChange={(text) =>
                    onChange({
                      ...part,
                      options: part.options.map((entry, offset) => (offset === index ? { ...entry, text } : entry)),
                    })
                  }
                />
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                aria-label={`移除选项 ${option.key}`}
                onClick={() => onChange({ ...part, options: part.options.filter((_, offset) => offset !== index) })}
              >
                移除
              </Button>
            </div>
          ))}
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={part.options.length >= 6}
            onClick={() => {
              const key = ['A', 'B', 'C', 'D', 'E', 'F'].find(
                (candidate) => !part.options.some((option) => option.key === candidate)
              )
              if (key) onChange({ ...part, options: [...part.options, { key, text: '' }] })
            }}
          >
            添加选项
          </Button>
        </div>
      )}
      {part.type === 'TRUE_FALSE' ? (
        <Field label='参考答案'>
          <select
            className={selectClass}
            value={part.answer}
            onChange={(event) => onChange({ ...part, answer: event.target.value })}
          >
            <option value=''>未填写</option>
            <option>正确</option>
            <option>错误</option>
          </select>
        </Field>
      ) : (
        <MarkupField
          label={choice ? '参考答案（选项标识，多选用逗号分隔）' : '参考答案'}
          value={part.answer}
          onChange={(answer) => onChange({ ...part, answer })}
        />
      )}
      <MarkupField
        label='解析'
        value={part.explanation}
        onChange={(explanation) => onChange({ ...part, explanation })}
      />
    </div>
  )
}

export function QuestionEditor({
  banks,
  initialBankId,
  question,
  onSaved,
  onCancel,
}: {
  banks: Bank[]
  initialBankId: string
  question?: QuestionRow
  onSaved: () => void
  onCancel: () => void
}) {
  const [bankId, setBankId] = useState(question?.bankId ?? initialBankId)
  const [content, setContent] = useState<QuestionContent>(question?.content ?? blankQuestion())
  const [status, setStatus] = useState<keyof typeof statusLabels>(question?.status ?? 'DRAFT')
  const [knowledgeText, setKnowledgeText] = useState(content.knowledgePoints.join('，'))
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)
  const mutation = useQuestionBankCommand()
  const selectedBank = banks.find((bank) => bank.id === bankId)
  const set = <K extends keyof QuestionContent>(key: K, value: QuestionContent[K]) =>
    setContent((current) => ({ ...current, [key]: value }))
  async function save(event: FormEvent) {
    event.preventDefault()
    const parsed = questionContentSchema.safeParse({
      ...content,
      knowledgePoints: [
        ...new Set(
          knowledgeText
            .split(/[,，|]/)
            .map((name) => name.trim())
            .filter(Boolean)
        ),
      ],
    })
    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => `${issue.path.join('.')}：${issue.message}`).join('；'))
      return
    }
    setError('')
    try {
      await mutation.mutateAsync({
        action: 'saveQuestion',
        id: question?.id,
        version: question?.version,
        bankId,
        content: parsed.data,
        status,
      })
      onSaved()
    } catch {
      /* The mutation displays the server error and keeps the form open. */
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{question ? '编辑题目' : '录入题目'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className='space-y-5'>
          <div className='grid gap-4 sm:grid-cols-3'>
            <Field label='所属题库'>
              <select
                required
                className={selectClass}
                value={bankId}
                disabled={!!question}
                onChange={(event) => setBankId(event.target.value)}
              >
                <option value=''>请选择题库</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.scope === 'PUBLIC' ? '公共 · ' : ''}
                    {bank.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label='题型'>
              <select
                className={selectClass}
                value={content.type}
                onChange={(event) => {
                  const type = event.target.value as QuestionContent['type']
                  setContent((current) => ({
                    ...current,
                    type,
                    options: ['SINGLE', 'MULTIPLE'].includes(type) ? current.options : [],
                    answer: '',
                    children: type === 'COMPOSITE' ? current.children : [],
                  }))
                }}
              >
                {Object.entries(questionTypes).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={selectedBank?.scope === 'PUBLIC' ? '状态（可用即对用户发布）' : '状态'}>
              <select
                className={selectClass}
                value={status}
                onChange={(event) => setStatus(event.target.value as typeof status)}
              >
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label='学段'>
              <select
                className={selectClass}
                value={content.stage}
                onChange={(event) => set('stage', event.target.value as QuestionContent['stage'])}
              >
                {Object.entries(stageLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <TextField
              label='学科'
              value={content.subject}
              onChange={(value) => set('subject', value)}
              required
              maxLength={40}
            />
            <TextField
              label='年级（可选）'
              value={content.grade}
              onChange={(value) => set('grade', value)}
              maxLength={20}
            />
            <Field label='人工标注难度'>
              <select
                className={selectClass}
                value={content.difficulty}
                onChange={(event) => set('difficulty', Number(event.target.value))}
              >
                {[1, 2, 3, 4, 5].map((level) => (
                  <option key={level} value={level}>
                    {level} / 5
                  </option>
                ))}
              </select>
            </Field>
            <TextField label='教材版本（可选）' value={content.textbook} onChange={(value) => set('textbook', value)} />
            <TextField label='章节（可选）' value={content.chapter} onChange={(value) => set('chapter', value)} />
          </div>
          <Field label='知识点（多个名称用逗号分隔）'>
            <Input
              value={knowledgeText}
              onChange={(event) => setKnowledgeText(event.target.value)}
              maxLength={2000}
              list='qb-knowledge-suggestions'
            />
            <datalist id='qb-knowledge-suggestions'>
              {selectedBank?.knowledgePoints.map((point) => (
                <option key={point.id} value={point.name} />
              ))}
            </datalist>
          </Field>
          <p className='text-xs text-muted-foreground'>
            支持 Markdown 与 MathML 公式。插入公式模板后可修改其中的字母和数字。图片嵌入题目保存，每张不超过 180 KB。
          </p>
          <MarkupField
            label={content.type === 'COMPOSITE' ? '共用材料' : '题干'}
            value={content.stem}
            onChange={(value) => set('stem', value)}
            required
          />
          {content.type === 'COMPOSITE' ? (
            <div className='space-y-4'>
              {content.children.map((child, index) => (
                <div key={index} className='space-y-3 rounded-md border p-4'>
                  <div className='flex items-center justify-between gap-2'>
                    <strong>第 {index + 1} 小题</strong>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        set(
                          'children',
                          content.children.filter((_, offset) => offset !== index)
                        )
                      }
                    >
                      移除小题
                    </Button>
                  </div>
                  <Field label='小题题型'>
                    <select
                      className={selectClass}
                      value={child.type}
                      onChange={(event) =>
                        set(
                          'children',
                          content.children.map((part, offset) =>
                            offset === index
                              ? { ...part, type: event.target.value as QuestionPart['type'], answer: '', options: [] }
                              : part
                          )
                        )
                      }
                    >
                      {Object.entries(questionTypes)
                        .filter(([key]) => key !== 'COMPOSITE')
                        .map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <PartEditor
                    part={child}
                    onChange={(value) =>
                      set(
                        'children',
                        content.children.map((part, offset) => (offset === index ? value : part))
                      )
                    }
                  />
                </div>
              ))}
              <Button
                type='button'
                variant='outline'
                disabled={content.children.length >= 30}
                onClick={() =>
                  set('children', [
                    ...content.children,
                    { type: 'SHORT', stem: '', options: [], answer: '', explanation: '' },
                  ])
                }
              >
                添加小题
              </Button>
            </div>
          ) : (
            <PartEditor
              part={{ ...content, type: content.type as QuestionPart['type'] }}
              withStem={false}
              onChange={(part) => setContent((current) => ({ ...current, ...part }))}
            />
          )}
          <div className='grid gap-4 sm:grid-cols-2'>
            <TextField
              label='题目出处（公共发布必填）'
              value={content.source}
              onChange={(value) => set('source', value)}
              maxLength={500}
            />
            <TextField
              label='使用授权说明（公共发布必填）'
              value={content.usageRights}
              onChange={(value) => set('usageRights', value)}
              maxLength={500}
            />
          </div>
          {question?.sourceQuestionId && (
            <p className='text-sm text-muted-foreground'>
              复制来源：{question.sourceBankName}，原题编号 {question.sourceQuestionId}
            </p>
          )}
          {error && (
            <p role='alert' className='text-sm text-destructive'>
              {error}
            </p>
          )}
          <div className='flex flex-wrap gap-2'>
            <Button type='submit' disabled={mutation.isPending || !bankId}>
              {mutation.isPending ? '正在保存…' : '保存题目'}
            </Button>
            <Button type='button' variant='outline' onClick={() => setPreview(!preview)}>
              {preview ? '收起预览' : '预览题目与答案'}
            </Button>
            <Button type='button' variant='ghost' onClick={onCancel}>
              返回列表
            </Button>
          </div>
          {preview && (
            <div className='rounded-md border p-4'>
              <QuestionContentView content={content} answers />
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
