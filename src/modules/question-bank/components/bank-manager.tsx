import { useState, type FormEvent } from 'react'
import { Archive } from 'lucide-react'
import { ConfirmDialog } from '~/components/confirm-dialog'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Textarea } from '~/components/ui/textarea'
import { useQuestionBankCommand, type Bank } from '../shared/hooks'
import { Field, selectClass, TextField } from './fields'

export function BankManager({
  banks,
  scope,
  onSelect,
}: {
  banks: Bank[]
  scope: 'PERSONAL' | 'PUBLIC'
  onSelect: (id: string) => void
}) {
  const [editing, setEditing] = useState<Bank | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [knowledgeBankId, setKnowledgeBankId] = useState('')
  const [pointId, setPointId] = useState('')
  const [pointName, setPointName] = useState('')
  const [parentId, setParentId] = useState('')
  const [archiveTarget, setArchiveTarget] = useState<Bank | null>(null)
  const mutation = useQuestionBankCommand()
  const selectedBank = banks.find((bank) => bank.id === knowledgeBankId)
  async function archive() {
    if (!archiveTarget) return
    try {
      await mutation.mutateAsync({ action: 'archiveBank', id: archiveTarget.id, version: archiveTarget.version })
      setArchiveTarget(null)
    } catch {
      /* Keep the selected bank available for retry. */
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault()
    try {
      await mutation.mutateAsync({
        action: 'saveBank',
        scope,
        id: editing?.id,
        version: editing?.version,
        name,
        description,
      })
      setShowForm(false)
      setEditing(null)
      setName('')
      setDescription('')
    } catch {
      /* Keep the form available. */
    }
  }
  async function savePoint(event: FormEvent) {
    event.preventDefault()
    try {
      await mutation.mutateAsync({
        action: 'saveKnowledgePoint',
        bankId: knowledgeBankId,
        name: pointName,
        id: pointId || undefined,
        parentId: parentId || null,
      })
      setPointId('')
      setPointName('')
      setParentId('')
    } catch {
      /* The server validates ownership and cycles. */
    }
  }
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between gap-2'>
        <CardTitle className='text-lg'>{scope === 'PUBLIC' ? '公共题库维护' : '我的题库'}</CardTitle>
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            setEditing(null)
            setName('')
            setDescription('')
            setShowForm(true)
          }}
        >
          新建题库
        </Button>
      </CardHeader>
      <CardContent className='space-y-4'>
        {showForm && (
          <form onSubmit={save} className='space-y-3 rounded-md border p-4'>
            <TextField label={editing ? '修改题库名称' : '题库名称'} value={name} onChange={setName} required />
            <Field label='说明'>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
                rows={2}
              />
            </Field>
            <div className='flex gap-2'>
              <Button disabled={mutation.isPending} type='submit'>
                保存题库
              </Button>
              <Button type='button' variant='ghost' onClick={() => setShowForm(false)}>
                取消
              </Button>
            </div>
          </form>
        )}
        <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
          {banks.map((bank) => (
            <div key={bank.id} className='space-y-3 rounded-md border p-4'>
              <h3 className='font-semibold'>{bank.name}</h3>
              <p className='text-sm text-muted-foreground'>{bank.description || '暂无说明'}</p>
              <p className='text-xs text-muted-foreground'>
                {bank._count.questions} 道题目 · {bank.knowledgePoints.length} 个知识点
              </p>
              <div className='flex flex-wrap gap-2'>
                <Button size='sm' variant='outline' onClick={() => onSelect(bank.id)}>
                  查看题目
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => {
                    setEditing(bank)
                    setName(bank.name)
                    setDescription(bank.description)
                    setShowForm(true)
                  }}
                >
                  修改
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => {
                    setKnowledgeBankId(bank.id)
                    setPointId('')
                    setPointName('')
                    setParentId('')
                  }}
                >
                  知识点
                </Button>
                <Button size='sm' variant='ghost' disabled={mutation.isPending} onClick={() => setArchiveTarget(bank)}>
                  <Archive className='mr-1 h-4 w-4' />
                  归档
                </Button>
              </div>
            </div>
          ))}
        </div>
        {!banks.length && (
          <p className='text-sm text-muted-foreground'>还没有题库，先新建一个题库，再录入或导入题目。</p>
        )}
        <ConfirmDialog
          open={!!archiveTarget}
          onOpenChange={(open) => {
            if (!open && !mutation.isPending) setArchiveTarget(null)
          }}
          title='确认归档题库'
          desc={`归档后“${archiveTarget?.name ?? ''}”将不再出现在列表和检索中，已有试卷的内容快照会保留。`}
          cancelBtnText='取消'
          confirmText={mutation.isPending ? '正在归档…' : '确认归档'}
          destructive
          isLoading={mutation.isPending}
          handleConfirm={() => void archive()}
        />
        {selectedBank && (
          <div className='space-y-4 rounded-md border p-4'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold'>{selectedBank.name} · 知识点</h3>
              <Button size='sm' variant='ghost' onClick={() => setKnowledgeBankId('')}>
                收起
              </Button>
            </div>
            <div className='flex flex-wrap gap-2'>
              {selectedBank.knowledgePoints.map((point) => (
                <Button
                  key={point.id}
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    setPointId(point.id)
                    setPointName(point.name)
                    setParentId(point.parentId ?? '')
                  }}
                >
                  {point.parentId
                    ? `${selectedBank.knowledgePoints.find((parent) => parent.id === point.parentId)?.name ?? ''} / `
                    : ''}
                  {point.name}
                </Button>
              ))}
            </div>
            <form onSubmit={savePoint} className='grid items-end gap-3 sm:grid-cols-3'>
              <TextField
                label={pointId ? '已有知识点（点击其他知识点可切换）' : '新知识点名称'}
                value={pointName}
                onChange={setPointName}
                required
                maxLength={80}
              />
              <Field label='上级知识点'>
                <select className={selectClass} value={parentId} onChange={(event) => setParentId(event.target.value)}>
                  <option value=''>顶级</option>
                  {selectedBank.knowledgePoints
                    .filter((point) => point.id !== pointId)
                    .map((point) => (
                      <option key={point.id} value={point.id}>
                        {point.name}
                      </option>
                    ))}
                </select>
              </Field>
              <div className='flex gap-2'>
                <Button type='submit' disabled={mutation.isPending}>
                  保存知识点
                </Button>
                {pointId && (
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={() => {
                      setPointId('')
                      setPointName('')
                      setParentId('')
                    }}
                  >
                    新增
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
