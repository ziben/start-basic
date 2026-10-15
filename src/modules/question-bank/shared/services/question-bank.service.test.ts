import { beforeEach, describe, expect, it, vi } from 'vitest'
import { blankQuestion, questionContentSchema } from '../domain'
import { QuestionBankService } from './question-bank.service'

const { db } = vi.hoisted(() => {
  const model = () => ({
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
  })
  return {
    db: {
      questionBank: model(),
      bankQuestion: model(),
      questionPaper: model(),
      questionPaperSection: model(),
      questionKnowledgePoint: model(),
      questionImportBatch: model(),
      $queryRaw: vi.fn(),
      $transaction: vi.fn(),
    },
  }
})
vi.mock('~/shared/lib/db', () => ({ getDb: async () => db }))

const user = { id: 'owner', role: 'user' }
const admin = { id: 'maintainer', role: 'admin' }
const content = () =>
  questionContentSchema.parse({ ...blankQuestion(), stem: '计算 1+1', subject: '数学', answer: '2' })
const bank = (scope: 'PERSONAL' | 'PUBLIC' = 'PERSONAL') => ({
  id: 'bank',
  ownerId: user.id,
  scope,
  archived: false,
  name: '我的题库',
  version: 1,
})
const savePaperInput = () => ({
  action: 'savePaper',
  title: '练习',
  sections: [{ title: '一、试题', items: [{ questionId: 'question', score: 2.5 }] }],
})

beforeEach(() => {
  vi.resetAllMocks()
  db.$transaction.mockImplementation((callback: (tx: typeof db) => unknown) => callback(db))
  db.$queryRaw.mockResolvedValue([])
  db.questionBank.findFirst.mockResolvedValue(bank())
  db.bankQuestion.findMany.mockResolvedValue([])
  db.questionKnowledgePoint.findMany.mockResolvedValue([])
  db.questionPaper.findMany.mockResolvedValue([])
  db.questionImportBatch.findMany.mockResolvedValue([])
  db.questionImportBatch.findUnique.mockResolvedValue(null)
  db.questionBank.findMany.mockResolvedValue([])
})

describe('question bank authorization', () => {
  it('does not let administrators bootstrap other users private banks or papers', async () => {
    await QuestionBankService.bootstrap(admin)
    expect(db.questionBank.findMany.mock.calls[0][0].where.OR).toEqual([
      { scope: 'PERSONAL', ownerId: admin.id },
      { scope: 'PUBLIC' },
    ])
    expect(db.questionPaper.findMany.mock.calls[0][0].where.ownerId).toBe(admin.id)
  })
  it('ignores a regular users maintenance flag and forces public publication status', async () => {
    db.bankQuestion.count.mockResolvedValue(0)
    await QuestionBankService.search(user, { scope: 'PUBLIC', maintenance: true, status: 'DRAFT' })
    expect(db.bankQuestion.findMany.mock.calls[0][0].where).toMatchObject({
      status: 'READY',
      bank: { scope: 'PUBLIC', archived: false },
    })
  })
  it('keeps personal searches scoped even for a maintainer with an arbitrary bank id', async () => {
    db.bankQuestion.count.mockResolvedValue(0)
    await QuestionBankService.search(admin, { bankId: 'victim-bank' })
    expect(db.bankQuestion.findMany.mock.calls[0][0].where.bank.ownerId).toBe(admin.id)
  })
  it('rejects unauthorized public bank creation before a database write', async () => {
    await expect(
      QuestionBankService.command(user, { action: 'saveBank', name: '公开', scope: 'PUBLIC' })
    ).rejects.toThrow('权限')
    expect(db.questionBank.create).not.toHaveBeenCalled()
  })
  it('creates public banks without tying their lifetime to a maintainer account', async () => {
    db.questionBank.create.mockResolvedValue({ id: 'public-bank' })
    await QuestionBankService.command(admin, { action: 'saveBank', name: '公共数学', scope: 'PUBLIC' })
    expect(db.questionBank.create).toHaveBeenCalledWith({
      data: { name: '公共数学', description: '', scope: 'PUBLIC', ownerId: null },
    })
  })
  it('rejects an inaccessible bank and never writes a question', async () => {
    db.questionBank.findFirst.mockResolvedValue(null)
    await expect(
      QuestionBankService.command(admin, {
        action: 'saveQuestion',
        bankId: 'private-victim',
        content: content(),
      })
    ).rejects.toThrow('权限')
    const predicate = db.questionBank.findFirst.mock.calls[0][0].where
    expect(predicate.OR).toEqual([{ scope: 'PERSONAL', ownerId: admin.id }, { scope: 'PUBLIC' }])
    expect(db.bankQuestion.create).not.toHaveBeenCalled()
  })
  it('rejects writes if a bank was archived while waiting for its lock', async () => {
    db.questionBank.findFirst.mockResolvedValueOnce(bank()).mockResolvedValueOnce(null)
    await expect(
      QuestionBankService.command(user, {
        action: 'saveQuestion',
        bankId: 'bank',
        content: content(),
      })
    ).rejects.toThrow('归档')
    expect(db.bankQuestion.create).not.toHaveBeenCalled()
  })
  it('requires source and usage rights before public publication', async () => {
    db.questionBank.findFirst.mockResolvedValue(bank('PUBLIC'))
    await expect(
      QuestionBankService.command(admin, {
        action: 'saveQuestion',
        bankId: 'bank',
        content: content(),
        status: 'READY',
      })
    ).rejects.toThrow('授权')
    expect(db.bankQuestion.create).not.toHaveBeenCalled()
  })
  it('makes subquestion text searchable without changing the shared material', async () => {
    db.bankQuestion.create.mockResolvedValue({ id: 'composite' })
    const combined = {
      ...content(),
      type: 'COMPOSITE',
      stem: '共同材料',
      children: [{ type: 'SHORT', stem: '独立小题关键词', options: [], answer: '2', explanation: '' }],
    }
    await QuestionBankService.command(user, {
      action: 'saveQuestion',
      bankId: 'bank',
      content: combined,
    })
    const stored = db.bankQuestion.create.mock.calls[0][0].data
    expect(stored.stem).toContain('独立小题关键词')
    expect(stored.content.stem).toBe('共同材料')
    expect(stored.content.children[0].stem).toBe('独立小题关键词')
  })
  it('never creates a paper from a disabled or inaccessible question', async () => {
    await expect(QuestionBankService.command(user, savePaperInput())).rejects.toThrow('重新选题')
    expect(db.bankQuestion.findMany.mock.calls[0][0].where).toMatchObject({ status: 'READY' })
    expect(db.questionPaper.create).not.toHaveBeenCalled()
  })
})

describe('paper snapshots and concurrency', () => {
  const oldPaper = () => ({
    id: 'paper',
    ownerId: user.id,
    version: 2,
    title: '原试卷',
    instructions: '',
    archived: false,
    sections: [
      {
        id: 'section',
        title: '一',
        position: 0,
        items: [
          {
            id: 'item',
            sourceQuestionId: 'question',
            sourceBankName: '原公共题库',
            snapshot: content(),
            score: 2.5,
            position: 0,
            answerLines: 3,
          },
        ],
      },
    ],
  })
  it('preserves an existing snapshot without reloading a changed or retired source', async () => {
    db.questionPaper.findFirst.mockResolvedValue(oldPaper())
    db.questionPaper.updateMany.mockResolvedValue({ count: 1 })
    const request = savePaperInput()
    await QuestionBankService.command(user, {
      ...request,
      id: 'paper',
      version: 2,
      sections: [{ title: '重新编排', items: [{ id: 'item', questionId: 'question', score: 7.25 }] }],
    })
    const saved = db.questionPaper.update.mock.calls[0][0].data.sections.create[0].items.create[0]
    expect(saved.snapshot).toEqual(content())
    expect(saved.sourceBankName).toBe('原公共题库')
    expect(saved.score).toBe(7.25)
    expect(db.bankQuestion.findMany.mock.calls[0][0].where.id.in).toEqual([])
  })
  it('rejects foreign item ids rather than accepting client snapshot references', async () => {
    db.questionPaper.findFirst.mockResolvedValue(oldPaper())
    await expect(
      QuestionBankService.command(user, {
        ...savePaperInput(),
        id: 'paper',
        version: 2,
        sections: [{ title: '一', items: [{ id: 'foreign-item', questionId: 'question', score: 1 }] }],
      })
    ).rejects.toThrow('快照')
    expect(db.questionPaperSection.deleteMany).not.toHaveBeenCalled()
  })
  it('rejects stale versions before deleting or replacing existing sections', async () => {
    db.questionPaper.findFirst.mockResolvedValue(oldPaper())
    db.questionPaper.updateMany.mockResolvedValue({ count: 0 })
    await expect(
      QuestionBankService.command(user, {
        ...savePaperInput(),
        id: 'paper',
        version: 1,
        sections: [{ title: '一', items: [{ id: 'item', questionId: 'question', score: 1 }] }],
      })
    ).rejects.toThrow('刷新')
    expect(db.questionPaperSection.deleteMany).not.toHaveBeenCalled()
  })
  it('scopes detail access and archive operations to the current owner', async () => {
    db.questionPaper.findFirst.mockResolvedValue(null)
    await expect(QuestionBankService.getPaper(admin, 'victim-paper')).rejects.toThrow('权限')
    expect(db.questionPaper.findFirst.mock.calls[0][0].where).toMatchObject({ ownerId: admin.id })
    db.questionPaper.updateMany.mockResolvedValue({ count: 0 })
    await expect(
      QuestionBankService.command(admin, { action: 'archivePaper', id: 'victim-paper', version: 1 })
    ).rejects.toThrow('无权限')
    expect(db.questionPaper.updateMany.mock.calls[0][0].where.ownerId).toBe(admin.id)
  })
})

describe('import batches', () => {
  const request = () => ({
    bankId: 'bank',
    fileName: 'test.json',
    format: 'json' as const,
    text: JSON.stringify([content(), content(), { subject: '数学' }]),
  })
  it('previews valid rows, intra-file duplicates and errors independently', async () => {
    const preview = await QuestionBankService.previewImport(user, request())
    expect(preview.totalCount).toBe(3)
    expect(preview.ready).toHaveLength(1)
    expect(preview.duplicates[0].row).toBe(2)
    expect(preview.errors[0].row).toBe(3)
    expect(db.bankQuestion.create).not.toHaveBeenCalled()
  })
  it('imports only unique valid drafts, records failures and reuses a completed request', async () => {
    db.questionImportBatch.create.mockImplementation(({ data }) => ({ id: 'batch', ...data }))
    const input = { ...request(), action: 'confirmImport', requestKey: 'f38003c4-f052-49a6-a70c-c14832af83ad' }
    const first = await QuestionBankService.command(user, input)
    expect(first.id).toBe('batch')
    expect(db.bankQuestion.create).toHaveBeenCalledTimes(1)
    expect(db.bankQuestion.create.mock.calls[0][0].data.status).toBe('DRAFT')
    const stored = db.questionImportBatch.create.mock.calls[0][0].data
    expect(stored).toMatchObject({ totalCount: 3, importedCount: 1, duplicateCount: 1, errorCount: 1 })
    db.questionImportBatch.findUnique.mockResolvedValue({ id: 'batch', ...stored })
    await expect(QuestionBankService.command(user, input)).resolves.toMatchObject({ id: 'batch' })
    expect(db.bankQuestion.create).toHaveBeenCalledTimes(1)
    await expect(QuestionBankService.command(user, { ...input, text: JSON.stringify([content()]) })).rejects.toThrow(
      '标识冲突'
    )
  })
  it('does not record a successful batch after a write fails inside the transaction', async () => {
    db.bankQuestion.create.mockRejectedValue(new Error('database write failure'))
    await expect(
      QuestionBankService.command(user, {
        ...request(),
        action: 'confirmImport',
        requestKey: 'f38003c4-f052-49a6-a70c-c14832af83ad',
      })
    ).rejects.toThrow('write failure')
    expect(db.$transaction).toHaveBeenCalled()
    expect(db.questionImportBatch.create).not.toHaveBeenCalled()
  })
  it('rejects knowledge point cycles and parents from another bank', async () => {
    db.questionKnowledgePoint.findMany.mockResolvedValue([
      { id: 'parent', parentId: 'child' },
      { id: 'child', parentId: null },
    ])
    await expect(
      QuestionBankService.command(user, {
        action: 'saveKnowledgePoint',
        bankId: 'bank',
        id: 'child',
        name: '点',
        parentId: 'parent',
      })
    ).rejects.toThrow('循环')
    await expect(
      QuestionBankService.command(user, {
        action: 'saveKnowledgePoint',
        bankId: 'bank',
        name: '点',
        parentId: 'foreign',
      })
    ).rejects.toThrow('不属于')
  })
})
