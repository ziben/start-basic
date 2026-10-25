import { useDeferredValue, useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { BookOpen, FileText, Library, Plus, Search, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '~/components/confirm-dialog'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { BankManager } from './components/bank-manager'
import { Field, selectClass } from './components/fields'
import { ImportWorkbench } from './components/import-workbench'
import { PaperEditor, draftFromPaper, paperFromSelection, type PaperDraft } from './components/paper-editor'
import { QuestionContentView } from './components/question-content'
import { QuestionEditor } from './components/question-editor'
import { paperSearchSchema, questionSearchSchema, questionTypes, stageLabels, statusLabels } from './shared/domain'
import {
  useBankQuestions,
  useQuestionBankBootstrap,
  useQuestionBankCommand,
  useQuestionPapers,
  type Bootstrap,
  type PaperListItem,
  type QuestionBankCommandMutation,
  type QuestionRow,
} from './shared/hooks'
import { getQuestionPaperFn } from './shared/server-fns/question-bank.fn'

export type BankView = 'mine' | 'public' | 'manage' | 'import' | 'papers'
const tabs: { value: BankView; title: string; icon: typeof BookOpen }[] = [
  { value: 'mine', title: '我的题库', icon: BookOpen },
  { value: 'public', title: '公共题库', icon: Library },
  { value: 'import', title: '导入工作台', icon: Upload },
  { value: 'papers', title: '我的试卷', icon: FileText },
]
export function QuestionBankPage({ view }: { view: BankView }) {
  const bootstrap = useQuestionBankBootstrap()
  return (
    <AppHeaderMain>
      {bootstrap.isPending && <p role='status'>正在加载题库…</p>}
      {bootstrap.error && (
        <div role='alert' className='space-y-3 text-destructive'>
          <p>题库加载失败：{bootstrap.error.message}</p>
          <Button variant='outline' onClick={() => void bootstrap.refetch()}>
            重试
          </Button>
        </div>
      )}
      {bootstrap.data && <Workspace key={bootstrap.data.actorId} data={bootstrap.data} view={view} />}
    </AppHeaderMain>
  )
}
function Workspace({ data, view }: { data: Bootstrap; view: BankView }) {
  const mutation = useQuestionBankCommand()
  const [filters, setFilters] = useState(questionSearchSchema.parse({}))
  const [searchText, setSearchText] = useState('')
  const [basket, setBasket] = useState<QuestionRow[]>([])
  const [copyTarget, setCopyTarget] = useState('')
  const [paperTarget, setPaperTarget] = useState('')
  const [editor, setEditor] = useState<{ bankId: string; question?: QuestionRow } | null>(null)
  const [paperDraft, setPaperDraft] = useState<PaperDraft | null>(null)
  const [assembling, setAssembling] = useState(false)
  const [renderedView, setRenderedView] = useState(view)
  // Reset editors only after navigation has passed the unsaved changes guard.
  if (renderedView !== view) {
    setRenderedView(view)
    setEditor(null)
    setPaperDraft(null)
    setFilters(questionSearchSchema.parse({}))
    setSearchText('')
  }
  const maintenance = view === 'manage' && data.canManagePublic
  const scope = view === 'public' || view === 'manage' ? 'PUBLIC' : 'PERSONAL'
  const banks = data.banks.filter((bank) => bank.scope === scope)
  const personalBanks = data.banks.filter((bank) => bank.scope === 'PERSONAL')
  const editableBanks = data.banks.filter((bank) => bank.scope === 'PERSONAL' || data.canManagePublic)
  const selectedBankId = banks.some((bank) => bank.id === filters.bankId) ? filters.bankId : undefined
  const input = { ...filters, bankId: selectedBankId, scope, maintenance } as typeof filters
  const questions = useBankQuestions(input)
  const isQuestionsView = view === 'mine' || view === 'public' || maintenance
  function filter<K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }))
  }
  function selectBank(id: string) {
    filter('bankId', id)
  }
  function submitSearch(event: FormEvent) {
    event.preventDefault()
    filter('keyword', searchText)
  }
  function toggleQuestion(question: QuestionRow) {
    if (basket.some((entry) => entry.id === question.id)) setBasket(basket.filter((entry) => entry.id !== question.id))
    else if (basket.length >= 100) toast.error('每份试卷最多选择 100 道题目')
    else setBasket([...basket, question])
  }
  async function compose() {
    if (!basket.length) return
    setAssembling(true)
    try {
      let draft = paperFromSelection(basket)
      if (paperTarget) {
        draft = draftFromPaper(await getQuestionPaperFn({ data: { id: paperTarget } }))
        const existing = new Set(draft.sections.flatMap((section) => section.items.map((item) => item.questionId)))
        draft.sections[0].items.push(
          ...paperFromSelection(basket.filter((question) => !existing.has(question.id))).sections[0].items
        )
      }
      setPaperDraft(draft)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '组卷失败')
    } finally {
      setAssembling(false)
    }
  }
  return (
    <div className='space-y-5'>
      <header className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>题库与组卷</h1>
          <p className='mt-1 text-sm text-muted-foreground'>整理个人题目，选用公共题库，编排家庭练习与教学试卷。</p>
        </div>
        {isQuestionsView && (view === 'mine' || maintenance) && (
          <Button
            disabled={!banks.length || !!editor || !!paperDraft}
            onClick={() => {
              setPaperDraft(null)
              setEditor({ bankId: banks.find((bank) => bank.id === filters.bankId)?.id ?? banks[0]?.id ?? '' })
            }}
          >
            <Plus className='mr-1 h-4 w-4' />
            手工录题
          </Button>
        )}
      </header>
      <nav aria-label='题库导航' className='flex flex-wrap gap-2'>
        {[
          ...tabs,
          ...(data.canManagePublic ? [{ value: 'manage' as const, title: '公共维护', icon: Library }] : []),
        ].map((tab) => (
          <Button asChild key={tab.value} size='sm' variant={view === tab.value ? 'default' : 'outline'}>
            <Link to='/question-bank' search={{ view: tab.value }}>
              <tab.icon className='mr-1 h-4 w-4' />
              {tab.title}
            </Link>
          </Button>
        ))}
      </nav>
      {view === 'manage' && !data.canManagePublic ? (
        <p role='alert'>没有公共题库维护权限。</p>
      ) : paperDraft ? (
        <PaperEditor key={paperDraft.id ?? 'new'} initial={paperDraft} onCancel={() => setPaperDraft(null)} />
      ) : editor ? (
        <QuestionEditor
          banks={editableBanks}
          initialBankId={editor.bankId}
          question={editor.question}
          onSaved={() => setEditor(null)}
          onCancel={() => setEditor(null)}
        />
      ) : view === 'import' ? (
        <ImportWorkbench banks={editableBanks} batches={data.batches} />
      ) : view === 'papers' ? (
        <PapersPanel mutation={mutation} />
      ) : (
        <>
          {(view === 'mine' || maintenance) && <BankManager banks={banks} scope={scope} onSelect={selectBank} />}
          {view === 'public' && (
            <p className='text-sm text-muted-foreground'>
              公共题库仅显示已发布的题目。可直接组卷，或复制到个人题库后修改。
            </p>
          )}
          <div className='grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]'>
            <div className='space-y-4'>
              <Card>
                <CardContent className='pt-5'>
                  <form onSubmit={submitSearch} className='grid gap-3 sm:grid-cols-3'>
                    <Field label='题库'>
                      <select
                        className={selectClass}
                        value={selectedBankId ?? ''}
                        onChange={(event) => filter('bankId', event.target.value || undefined)}
                      >
                        <option value=''>全部{scope === 'PUBLIC' ? '公共' : '个人'}题库</option>
                        {banks.map((bank) => (
                          <option key={bank.id} value={bank.id}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label='学段'>
                      <select
                        className={selectClass}
                        value={filters.stage}
                        onChange={(event) => filter('stage', event.target.value as typeof filters.stage)}
                      >
                        <option value=''>全部学段</option>
                        {Object.entries(stageLabels).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label='题型'>
                      <select
                        className={selectClass}
                        value={filters.type}
                        onChange={(event) => filter('type', event.target.value as typeof filters.type)}
                      >
                        <option value=''>全部题型</option>
                        {Object.entries(questionTypes).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label='学科'>
                      <Input
                        value={filters.subject}
                        maxLength={40}
                        onChange={(event) => filter('subject', event.target.value)}
                      />
                    </Field>
                    <Field label='年级'>
                      <Input
                        value={filters.grade}
                        maxLength={20}
                        onChange={(event) => filter('grade', event.target.value)}
                      />
                    </Field>
                    <Field label='知识点'>
                      <Input
                        value={filters.knowledgePoint}
                        maxLength={80}
                        onChange={(event) => filter('knowledgePoint', event.target.value)}
                      />
                    </Field>
                    <Field label='难度'>
                      <select
                        className={selectClass}
                        value={filters.difficulty ?? ''}
                        onChange={(event) =>
                          filter('difficulty', event.target.value ? Number(event.target.value) : undefined)
                        }
                      >
                        <option value=''>全部难度</option>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <option key={level} value={level}>
                            {level} / 5
                          </option>
                        ))}
                      </select>
                    </Field>
                    {(view === 'mine' || maintenance) && (
                      <Field label='状态'>
                        <select
                          className={selectClass}
                          value={filters.status}
                          onChange={(event) => filter('status', event.target.value as typeof filters.status)}
                        >
                          <option value=''>全部状态</option>
                          {Object.entries(statusLabels).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}
                    <div className='flex items-end gap-2 sm:col-span-3'>
                      <Field label='题干关键词'>
                        <Input
                          value={searchText}
                          maxLength={100}
                          onChange={(event) => setSearchText(event.target.value)}
                        />
                      </Field>
                      <Button type='submit'>
                        <Search className='mr-1 h-4 w-4' />
                        检索
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              {questions.isPending && <p role='status'>正在检索题目…</p>}
              {questions.error && (
                <p role='alert' className='text-destructive'>
                  {questions.error.message}
                </p>
              )}
              {questions.data?.rows.map((question) => (
                <Card key={question.id}>
                  <CardContent className='space-y-4 pt-5'>
                    <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                      <span>{question.bank.name}</span>
                      <span>{question.content.subject}</span>
                      <span>
                        {stageLabels[question.content.stage]} {question.content.grade}
                      </span>
                      <span>{questionTypes[question.content.type]}</span>
                      <span>难度 {question.difficulty}</span>
                      <span>{statusLabels[question.status]}</span>
                    </div>
                    <QuestionContentView content={question.content} />
                    <details>
                      <summary className='cursor-pointer text-sm font-medium'>查看答案、解析与来源</summary>
                      <div className='mt-3 space-y-3'>
                        <QuestionContentView content={question.content} answers />
                        <p className='text-xs text-muted-foreground'>
                          知识点：{question.content.knowledgePoints.join('、') || '未填写'}
                          <br />
                          出处：{question.content.source || '未填写'}
                          <br />
                          使用授权：{question.content.usageRights || '未填写'}
                        </p>
                      </div>
                    </details>
                    <div className='flex flex-wrap gap-2'>
                      <Button
                        size='sm'
                        variant={basket.some((entry) => entry.id === question.id) ? 'secondary' : 'default'}
                        disabled={question.status !== 'READY'}
                        onClick={() => toggleQuestion(question)}
                      >
                        {basket.some((entry) => entry.id === question.id)
                          ? '移出选题区'
                          : question.status === 'READY'
                            ? '加入选题区'
                            : '设为可用后可组卷'}
                      </Button>
                      {(view === 'mine' || maintenance) && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => setEditor({ bankId: question.bankId, question })}
                        >
                          编辑 / 修改状态
                        </Button>
                      )}
                      {view === 'public' && (
                        <Button
                          size='sm'
                          variant='outline'
                          disabled={mutation.isPending || !copyTarget}
                          onClick={() =>
                            mutation.mutate({ action: 'copyQuestion', id: question.id, bankId: copyTarget })
                          }
                        >
                          复制到个人题库
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {questions.data && !questions.data.total && (
                <p className='rounded-md border p-8 text-center text-sm text-muted-foreground'>
                  没有符合条件的题目
                  {view === 'mine' || maintenance ? '，可先录入或导入。' : '，请调整条件或等待平台发布。'}
                </p>
              )}
              {questions.data && (
                <div className='flex items-center justify-between gap-3 text-sm'>
                  <span>
                    共 {questions.data.total} 道 · 第 {filters.page} 页
                  </span>
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      disabled={filters.page <= 1}
                      onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    >
                      上一页
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      disabled={filters.page * 20 >= questions.data.total}
                      onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <aside className='space-y-4 xl:sticky xl:top-4'>
              {view === 'public' && (
                <Card>
                  <CardContent className='pt-5'>
                    <Field label='公共题目复制到'>
                      <select
                        className={selectClass}
                        value={copyTarget}
                        onChange={(event) => setCopyTarget(event.target.value)}
                      >
                        <option value=''>选择个人题库</option>
                        {personalBanks.map((bank) => (
                          <option key={bank.id} value={bank.id}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    {!personalBanks.length && (
                      <p className='mt-2 text-xs text-muted-foreground'>请先在“我的题库”中新建题库。</p>
                    )}
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>待组卷（{basket.length} / 100）</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <p className='text-xs text-muted-foreground'>
                    可跨个人与公共题库选题。选题区在当前页面中保留，刷新后清空。
                  </p>
                  {basket.map((question, index) => (
                    <div key={question.id} className='flex items-center gap-2 text-sm'>
                      <span className='min-w-0 flex-1 truncate'>
                        {index + 1}. {question.content.stem.slice(0, 50)}
                      </span>
                      <Button
                        size='sm'
                        variant='ghost'
                        aria-label={`移出第 ${index + 1} 道选题`}
                        onClick={() => toggleQuestion(question)}
                      >
                        移出
                      </Button>
                    </div>
                  ))}
                  <PaperTargetPicker value={paperTarget} onChange={setPaperTarget} />
                  <Button className='w-full' disabled={!basket.length || assembling} onClick={() => void compose()}>
                    {assembling ? '正在准备…' : '进入组卷编辑'}
                  </Button>
                  {!!basket.length && (
                    <Button className='w-full' variant='ghost' onClick={() => setBasket([])}>
                      清空选题区
                    </Button>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}

function PapersPanel({ mutation }: { mutation: QuestionBankCommandMutation }) {
  const [searchText, setSearchText] = useState('')
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [archiveTarget, setArchiveTarget] = useState<PaperListItem | null>(null)
  const query = useQuestionPapers(paperSearchSchema.parse({ page, pageSize: 10, filter }))
  const papers = query.data?.items ?? []
  const pageCount = query.data?.pageCount ?? 1

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    setFilter(searchText.trim())
    setPage(1)
  }

  async function archivePaper() {
    if (!archiveTarget) return
    try {
      await mutation.mutateAsync({ action: 'archivePaper', id: archiveTarget.id, version: archiveTarget.version })
      setArchiveTarget(null)
    } catch {
      /* 归档失败时保留目标，可重试或取消。 */
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>我的试卷</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <form onSubmit={submitSearch} className='flex gap-2'>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder='按标题检索全部未归档试卷'
            className='max-w-xs'
          />
          <Button type='submit' variant='outline' size='sm' disabled={query.isFetching}>
            <Search className='mr-1 h-4 w-4' />
            搜索
          </Button>
        </form>
        {query.isLoading ? (
          <p className='text-sm text-muted-foreground'>正在加载试卷…</p>
        ) : papers.length ? (
          <>
            {papers.map((paper) => (
              <div key={paper.id} className='flex flex-wrap items-center justify-between gap-3 rounded-md border p-4'>
                <div>
                  <Link
                    to='/question-bank/papers/$paperId'
                    params={{ paperId: paper.id }}
                    className='font-medium underline underline-offset-4'
                  >
                    {paper.title}
                  </Link>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {new Date(paper.updatedAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ action: 'copyPaper', id: paper.id })}
                  >
                    复制
                  </Button>
                  <Button size='sm' variant='ghost' disabled={mutation.isPending} onClick={() => setArchiveTarget(paper)}>
                    归档
                  </Button>
                </div>
              </div>
            ))}
            <div className='flex items-center justify-between text-sm text-muted-foreground'>
              <span>
                第 {query.data?.page ?? 1} / {pageCount} 页，共 {query.data?.total ?? 0} 份
              </span>
              <div className='flex gap-2'>
                <Button size='sm' variant='outline' disabled={page <= 1 || query.isFetching} onClick={() => setPage(page - 1)}>
                  上一页
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={page >= pageCount || query.isFetching}
                  onClick={() => setPage(page + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          </>
        ) : (
          <p className='text-sm text-muted-foreground'>
            {filter ? '没有匹配的未归档试卷，可调整关键词后重试。' : '暂无试卷，请先选题组卷。'}
          </p>
        )}
        <ConfirmDialog
          open={!!archiveTarget}
          onOpenChange={(open) => {
            if (!open && !mutation.isPending) setArchiveTarget(null)
          }}
          title='确认归档试卷'
          desc={`归档后“${archiveTarget?.title ?? ''}”将不再出现在试卷列表，试卷内容和题目快照会保留。`}
          cancelBtnText='取消'
          confirmText={mutation.isPending ? '正在归档…' : '确认归档'}
          destructive
          isLoading={mutation.isPending}
          handleConfirm={() => void archivePaper()}
        />
      </CardContent>
    </Card>
  )
}

function PaperTargetPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [keyword, setKeyword] = useState('')
  const deferredKeyword = useDeferredValue(keyword)
  const query = useQuestionPapers(paperSearchSchema.parse({ page: 1, pageSize: 20, filter: deferredKeyword }))
  const papers = query.data?.items ?? []
  const selectedMissing = value && !papers.some((paper) => paper.id === value)

  return (
    <Field label='组卷目标'>
      <div className='space-y-2'>
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder='搜索历史试卷作为追加目标'
          className='h-8 text-sm'
        />
        <select className={selectClass} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value=''>新建试卷</option>
          {selectedMissing && <option value={value}>已选试卷（不在当前结果中）</option>}
          {papers.map((paper) => (
            <option key={paper.id} value={paper.id}>
              {paper.title}
            </option>
          ))}
        </select>
      </div>
    </Field>
  )
}
