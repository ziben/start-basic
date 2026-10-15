import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { useQuestionBankCommand, type Bank, type Bootstrap } from '../shared/hooks'
import { csvTemplate, jsonTemplate } from '../shared/import-format'
import { previewQuestionImportFn } from '../shared/server-fns/question-bank.fn'
import { Field, selectClass } from './fields'
import { QuestionContentView } from './question-content'

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
type Preview = Awaited<ReturnType<typeof previewQuestionImportFn>>
export function ImportWorkbench({ banks, batches }: { banks: Bank[]; batches: Bootstrap['batches'] }) {
  const [bankId, setBankId] = useState(banks[0]?.id ?? '')
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [fileName, setFileName] = useState('手工粘贴.csv')
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [requestKey, setRequestKey] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const mutation = useQuestionBankCommand()
  function invalidate() {
    setPreview(null)
    setRequestKey('')
    setError('')
  }
  async function readFile(file?: File) {
    invalidate()
    if (!file) return
    if (file.size > 5_000_000) {
      setError('文件不能超过 5 MB')
      return
    }
    const nextFormat = file.name.toLowerCase().endsWith('.json')
      ? 'json'
      : file.name.toLowerCase().endsWith('.csv')
        ? 'csv'
        : null
    if (!nextFormat) {
      setError('请选择 CSV 或 JSON 文件')
      return
    }
    try {
      setFormat(nextFormat)
      setFileName(file.name)
      setText(await file.text())
    } catch {
      setError('文件读取失败')
    }
  }
  async function check() {
    setPending(true)
    setError('')
    setPreview(null)
    try {
      const result = await previewQuestionImportFn({ data: { bankId, format, text, fileName } })
      setPreview(result)
      setRequestKey(crypto.randomUUID())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '校验失败')
    } finally {
      setPending(false)
    }
  }
  async function confirmImport() {
    try {
      await mutation.mutateAsync({ action: 'confirmImport', bankId, format, text, fileName, requestKey })
      setPreview(null)
      setRequestKey('')
      setText('')
    } catch {
      /* Keep the same request key so a retry is idempotent. */
    }
  }
  return (
    <div className='space-y-5'>
      <Card>
        <CardHeader>
          <CardTitle>结构化文件导入</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-sm text-muted-foreground'>
            每次最多 200 道、5 MB。校验失败和重复题目会跳过，成功题目保存为草稿，不覆盖已有内容。CSV
            中的行号指数据记录序号，包含表头；JSON 使用题目序号。
          </p>
          <div className='flex flex-wrap gap-2'>
            <Button variant='outline' onClick={() => download('题目模板.csv', csvTemplate, 'text/csv;charset=utf-8')}>
              下载 CSV 模板
            </Button>
            <Button variant='outline' onClick={() => download('组合题模板.json', jsonTemplate, 'application/json')}>
              下载 JSON 模板
            </Button>
          </div>
          <p className='text-xs text-muted-foreground'>
            type：SINGLE 单选、MULTIPLE 多选、TRUE_FALSE 判断、FILL 填空、SHORT 解答、COMPOSITE 组合。stage：JUNIOR
            初中、SENIOR 高中。多选答案用逗号分隔，知识点用 | 分隔。组合题建议使用 JSON。
          </p>
          <div className='grid gap-4 sm:grid-cols-3'>
            <Field label='目标题库'>
              <select
                className={selectClass}
                value={bankId}
                onChange={(event) => {
                  setBankId(event.target.value)
                  invalidate()
                }}
              >
                <option value=''>请选择</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.scope === 'PUBLIC' ? '公共 · ' : ''}
                    {bank.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label='格式'>
              <select
                className={selectClass}
                value={format}
                onChange={(event) => {
                  const next = event.target.value as 'csv' | 'json'
                  setFormat(next)
                  setFileName(`手工粘贴.${next}`)
                  invalidate()
                }}
              >
                <option value='csv'>CSV</option>
                <option value='json'>JSON</option>
              </select>
            </Field>
            <Field label='上传文件'>
              <Input
                type='file'
                accept='.csv,.json'
                onChange={(event) => {
                  void readFile(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </Field>
          </div>
          <Field label={`文件内容：${fileName}`}>
            <Textarea
              rows={8}
              value={text}
              maxLength={5_000_000}
              onChange={(event) => {
                setText(event.target.value)
                invalidate()
              }}
              placeholder='上传文件，或在此粘贴模板格式的内容'
            />
          </Field>
          <Button onClick={() => void check()} disabled={pending || mutation.isPending || !bankId || !text}>
            {pending ? '正在校验…' : '校验并预览'}
          </Button>
          {error && (
            <p role='alert' className='text-destructive'>
              {error}
            </p>
          )}
          {preview && (
            <div className='space-y-3 rounded-md border p-4'>
              <p className='font-medium'>
                共 {preview.totalCount} 题 · 可导入 {preview.ready.length} · 重复 {preview.duplicates.length} · 错误{' '}
                {preview.errors.length}
              </p>
              {[...preview.errors, ...preview.duplicates].map((issue, index) => (
                <p key={index} className='text-sm'>
                  第 {issue.row} 行/项：{issue.message}
                </p>
              ))}
              {preview.ready.slice(0, 3).map((entry) => (
                <details key={entry.row}>
                  <summary className='cursor-pointer text-sm'>预览第 {entry.row} 行/项</summary>
                  <div className='mt-2 rounded border p-3'>
                    <QuestionContentView content={entry.content} answers />
                  </div>
                </details>
              ))}
              <Button onClick={() => void confirmImport()} disabled={mutation.isPending || !preview.ready.length}>
                {mutation.isPending ? '正在入库…' : `确认导入 ${preview.ready.length} 道草稿`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>最近 20 次导入</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {!batches.length && <p className='text-sm text-muted-foreground'>暂无导入记录</p>}
          {batches.map((batch) => (
            <details key={batch.id} className='rounded-md border p-3'>
              <summary className='cursor-pointer text-sm'>
                {batch.fileName} · {batch.bank.name} · 成功 {batch.importedCount} / 重复 {batch.duplicateCount} / 失败{' '}
                {batch.errorCount}
              </summary>
              <p className='mt-2 text-xs text-muted-foreground'>{new Date(batch.createdAt).toLocaleString('zh-CN')}</p>
              <pre className='mt-2 overflow-auto text-xs whitespace-pre-wrap'>
                {JSON.stringify(batch.details, null, 2)}
              </pre>
            </details>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
