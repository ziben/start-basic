import { createHash } from 'node:crypto'
import { Prisma } from '~/generated/prisma/client'
import { getDb } from '~/shared/lib/db'
import {
  assertPublishable,
  canManagePublic,
  commandSchema,
  importInputSchema,
  paperSearchSchema,
  questionContentSchema,
  questionSearchSchema,
  type QuestionActor,
  type QuestionCommand,
  type QuestionContent,
} from '../domain'
import { parseQuestionImport } from '../import-format'

type Db = Prisma.TransactionClient
type Bank = Prisma.QuestionBankGetPayload<Record<string, never>>
const conflict = '内容已被其他操作修改，请刷新后重试'
const fingerprint = (content: QuestionContent) =>
  createHash('sha256')
    .update(
      JSON.stringify({
        type: content.type,
        stem: content.stem.normalize('NFC').trim(),
        options: content.options,
        children: content.children.map(({ type, stem, options }) => ({ type, stem, options })),
      })
    )
    .digest('hex')
const json = (value: unknown) => value as Prisma.InputJsonValue

function personalOrPublic(actor: QuestionActor): Prisma.QuestionBankWhereInput {
  return { OR: [{ scope: 'PERSONAL', ownerId: actor.id }, { scope: 'PUBLIC' }] }
}
function editableBanks(actor: QuestionActor): Prisma.QuestionBankWhereInput {
  return {
    OR: [{ scope: 'PERSONAL', ownerId: actor.id }, ...(canManagePublic(actor) ? [{ scope: 'PUBLIC' as const }] : [])],
  }
}
function visibleQuestions(actor: QuestionActor): Prisma.BankQuestionWhereInput {
  return {
    bank: { archived: false },
    OR: [{ bank: { scope: 'PERSONAL', ownerId: actor.id } }, { bank: { scope: 'PUBLIC' }, status: 'READY' }],
  }
}
async function editableBank(db: Db, actor: QuestionActor, id: string): Promise<Bank> {
  const bank = await db.questionBank.findFirst({ where: { id, archived: false, ...editableBanks(actor) } })
  if (!bank) throw new Error('题库不存在或没有管理权限')
  // Mutations lock the bank before checking question state, including imports and archiving.
  await db.$queryRaw`SELECT id FROM question_bank WHERE id = ${id} FOR UPDATE`
  const current = await db.questionBank.findFirst({ where: { id, archived: false, ...editableBanks(actor) } })
  if (!current) throw new Error('题库已归档或没有管理权限')
  return current
}

async function knowledgeConnections(db: Db, bankId: string, names: string[]) {
  const ids = []
  for (const name of [...new Set(names)]) {
    const point = await db.questionKnowledgePoint.upsert({
      where: { bankId_name: { bankId, name } },
      update: {},
      create: { bankId, name },
    })
    ids.push({ id: point.id })
  }
  return ids
}

async function questionData(db: Db, bankId: string, content: QuestionContent) {
  return {
    content: json(content),
    // Search both a composite question's shared material and its subquestion stems.
    stem: [content.stem, ...content.children.map((child) => child.stem)].join('\n'),
    type: content.type,
    subject: content.subject,
    stage: content.stage,
    grade: content.grade,
    difficulty: content.difficulty,
    fingerprint: fingerprint(content),
    knowledgePoints: { set: await knowledgeConnections(db, bankId, content.knowledgePoints) },
  }
}

function presentQuestion<T extends { content: Prisma.JsonValue }>(question: T) {
  return { ...question, content: questionContentSchema.parse(question.content) }
}
const paperInclude = {
  sections: { orderBy: { position: 'asc' as const }, include: { items: { orderBy: { position: 'asc' as const } } } },
}
function presentPaper(paper: Prisma.QuestionPaperGetPayload<{ include: typeof paperInclude }>) {
  return {
    ...paper,
    sections: paper.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        score: item.score.toNumber(),
        snapshot: questionContentSchema.parse(item.snapshot),
      })),
    })),
  }
}

async function bootstrap(actor: QuestionActor) {
  const db = await getDb()
  const maintainer = canManagePublic(actor)
  const [banks, papers, batches] = await Promise.all([
    db.questionBank.findMany({
      where: { archived: false, ...personalOrPublic(actor) },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            questions: {
              where: maintainer
                ? {}
                : {
                    OR: [{ bank: { scope: 'PERSONAL', ownerId: actor.id } }, { status: 'READY' }],
                  },
            },
          },
        },
        knowledgePoints: {
          orderBy: { name: 'asc' },
          where: maintainer
            ? {}
            : {
                OR: [{ bank: { scope: 'PERSONAL', ownerId: actor.id } }, { questions: { some: { status: 'READY' } } }],
              },
        },
      },
    }),
    db.questionPaper.findMany({
      where: { ownerId: actor.id, archived: false },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: { id: true, title: true, version: true, updatedAt: true },
    }),
    db.questionImportBatch.findMany({
      where: { actorId: actor.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { bank: { select: { name: true } } },
    }),
  ])
  return { actorId: actor.id, canManagePublic: maintainer, banks, papers, batches }
}

async function search(actor: QuestionActor, raw: unknown) {
  const input = questionSearchSchema.parse(raw)
  const db = await getDb()
  const maintenance = input.maintenance && canManagePublic(actor)
  const where: Prisma.BankQuestionWhereInput = {
    bank: {
      archived: false,
      scope: input.scope,
      ...(input.scope === 'PERSONAL' ? { ownerId: actor.id } : {}),
    },
    ...(input.bankId ? { bankId: input.bankId } : {}),
    ...(input.keyword ? { stem: { contains: input.keyword, mode: 'insensitive' } } : {}),
    ...(input.subject ? { subject: { contains: input.subject, mode: 'insensitive' } } : {}),
    ...(input.stage ? { stage: input.stage } : {}),
    ...(input.grade ? { grade: { contains: input.grade } } : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(input.difficulty ? { difficulty: input.difficulty } : {}),
    ...(input.knowledgePoint ? { knowledgePoints: { some: { name: { contains: input.knowledgePoint } } } } : {}),
    ...(input.scope === 'PUBLIC' && !maintenance ? { status: 'READY' } : input.status ? { status: input.status } : {}),
  }
  const [total, rows] = await Promise.all([
    db.bankQuestion.count({ where }),
    db.bankQuestion.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      skip: (input.page - 1) * 20,
      take: 20,
      include: { bank: { select: { name: true, scope: true, ownerId: true } } },
    }),
  ])
  return { total, rows: rows.map(presentQuestion), page: input.page }
}

async function getQuestion(actor: QuestionActor, id: string) {
  const db = await getDb()
  const question = await db.bankQuestion.findFirst({
    where: {
      id,
      OR: [
        visibleQuestions(actor),
        ...(canManagePublic(actor) ? [{ bank: { scope: 'PUBLIC' as const, archived: false } }] : []),
      ],
    },
    include: { bank: { select: { name: true, scope: true, ownerId: true } } },
  })
  if (!question) throw new Error('题目不存在或没有访问权限')
  return presentQuestion(question)
}
async function getPaper(actor: QuestionActor, id: string) {
  const db = await getDb()
  const paper = await db.questionPaper.findFirst({
    where: { id, ownerId: actor.id, archived: false },
    include: paperInclude,
  })
  if (!paper) throw new Error('试卷不存在或没有访问权限')
  return presentPaper(paper)
}

// 按标题在当前用户全部未归档试卷中做服务端分页检索，弥补 bootstrap 只取最近 200 份的窗口限制。
async function listPapers(actor: QuestionActor, raw: unknown) {
  const input = paperSearchSchema.parse(raw)
  const db = await getDb()
  const keyword = input.filter.trim()
  const where: Prisma.QuestionPaperWhereInput = {
    ownerId: actor.id,
    archived: false,
    ...(keyword ? { title: { contains: keyword, mode: 'insensitive' } } : {}),
  }
  const [total, items] = await Promise.all([
    db.questionPaper.count({ where }),
    db.questionPaper.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      select: { id: true, title: true, version: true, updatedAt: true },
    }),
  ])
  return {
    items,
    total,
    page: input.page,
    pageSize: input.pageSize,
    pageCount: Math.ceil(total / input.pageSize),
  }
}

async function previewImport(actor: QuestionActor, raw: unknown) {
  const input = importInputSchema.parse(raw)
  const db = await getDb()
  const bank = await db.questionBank.findFirst({
    where: { id: input.bankId, archived: false, ...editableBanks(actor) },
  })
  if (!bank) throw new Error('题库不存在或没有管理权限')
  return prepareImport(db, input)
}
async function prepareImport(db: Db, input: ReturnType<typeof importInputSchema.parse>) {
  const parsed = parseQuestionImport(input.text, input.format)
  const hashes = parsed.valid.map((entry) => fingerprint(entry.content))
  const existing = await db.bankQuestion.findMany({
    where: { bankId: input.bankId, fingerprint: { in: hashes } },
    select: { fingerprint: true },
  })
  const seen = new Set(existing.map((question) => question.fingerprint))
  const duplicates: { row: number; message: string }[] = []
  const ready = parsed.valid.filter((entry) => {
    const hash = fingerprint(entry.content)
    if (seen.has(hash)) {
      duplicates.push({ row: entry.row, message: '与题库已有题目或文件内题目重复，跳过且不覆盖' })
      return false
    }
    seen.add(hash)
    return true
  })
  return { totalCount: parsed.totalCount, errors: parsed.errors, ready, duplicates }
}

async function savePaper(db: Db, actor: QuestionActor, input: Extract<QuestionCommand, { action: 'savePaper' }>) {
  const old = input.id
    ? await db.questionPaper.findFirst({
        where: { id: input.id, ownerId: actor.id, archived: false },
        include: paperInclude,
      })
    : null
  if (input.id && (!old || !input.version)) throw new Error('试卷不存在或没有访问权限')
  const existingItems = new Map(old?.sections.flatMap((section) => section.items).map((item) => [item.id, item]) ?? [])
  const references = input.sections.flatMap((section) => section.items)
  const addedIds = references.filter((item) => !item.id).map((item) => item.questionId)
  const questions = await db.bankQuestion.findMany({
    where: { id: { in: addedIds }, ...visibleQuestions(actor), status: 'READY' },
    include: { bank: true },
  })
  const byId = new Map(questions.map((question) => [question.id, question]))
  const sections = input.sections.map((section, position) => ({
    title: section.title,
    position,
    items: {
      create: section.items.map((item, itemPosition) => {
        const previous = item.id ? existingItems.get(item.id) : undefined
        const current = !item.id ? byId.get(item.questionId) : undefined
        if (item.id && (!previous || previous.sourceQuestionId !== item.questionId)) throw new Error('试卷题目快照无效')
        if (!previous && !current) throw new Error('所选题目已停用、未发布或没有访问权限，请重新选题')
        return {
          ...(previous ? { id: previous.id } : {}),
          sourceQuestionId: previous?.sourceQuestionId ?? current!.id,
          sourceBankName: previous?.sourceBankName ?? current!.bank.name,
          snapshot: json(previous?.snapshot ?? current!.content),
          position: itemPosition,
          score: item.score,
          answerLines: item.answerLines,
        }
      }),
    },
  }))
  if (old) {
    const claimed = await db.questionPaper.updateMany({
      where: { id: old.id, ownerId: actor.id, version: input.version, archived: false },
      data: { title: input.title, instructions: input.instructions, version: { increment: 1 } },
    })
    if (!claimed.count) throw new Error(conflict)
    await db.questionPaperSection.deleteMany({ where: { paperId: old.id } })
    await db.questionPaper.update({ where: { id: old.id }, data: { sections: { create: sections } } })
    return { id: old.id, message: '试卷已保存，已有题目的快照保持不变' }
  }
  const created = await db.questionPaper.create({
    data: { ownerId: actor.id, title: input.title, instructions: input.instructions, sections: { create: sections } },
  })
  return { id: created.id, message: '试卷已保存' }
}

async function command(actor: QuestionActor, raw: unknown): Promise<{ id?: string; message: string }> {
  const input = commandSchema.parse(raw)
  const db = await getDb()
  try {
    return await db.$transaction(
      async (tx) => {
        switch (input.action) {
          case 'saveBank': {
            if (input.scope === 'PUBLIC' && !canManagePublic(actor)) throw new Error('没有公共题库维护权限')
            if (input.id) {
              const bank = await editableBank(tx, actor, input.id)
              if (bank.scope !== input.scope) throw new Error('题库的公开范围不能更改，请新建题库并复制题目')
              const updated = await tx.questionBank.updateMany({
                where: { id: bank.id, version: input.version ?? 0 },
                data: { name: input.name, description: input.description, version: { increment: 1 } },
              })
              if (!updated.count) throw new Error(conflict)
              return { id: bank.id, message: '题库已更新' }
            }
            const bank = await tx.questionBank.create({
              data: {
                name: input.name,
                description: input.description,
                scope: input.scope,
                ownerId: input.scope === 'PERSONAL' ? actor.id : null,
              },
            })
            return { id: bank.id, message: '题库已创建' }
          }
          case 'archiveBank': {
            await editableBank(tx, actor, input.id)
            const updated = await tx.questionBank.updateMany({
              where: { id: input.id, version: input.version },
              data: { archived: true, version: { increment: 1 } },
            })
            if (!updated.count) throw new Error(conflict)
            return { message: '题库已归档，已有试卷不受影响' }
          }
          case 'saveQuestion': {
            const bank = await editableBank(tx, actor, input.bankId)
            if (input.status === 'READY') assertPublishable(input.content, bank.scope === 'PUBLIC')
            const data = await questionData(tx, bank.id, input.content)
            if (input.id) {
              const { knowledgePoints, ...fields } = data
              const updated = await tx.bankQuestion.updateMany({
                where: { id: input.id, bankId: bank.id, version: input.version ?? 0 },
                data: { ...fields, status: input.status, version: { increment: 1 } },
              })
              if (!updated.count) throw new Error(conflict)
              await tx.bankQuestion.update({ where: { id: input.id }, data: { knowledgePoints } })
              return { id: input.id, message: '题目已保存' }
            }
            const { knowledgePoints, ...fields } = data
            const question = await tx.bankQuestion.create({
              data: {
                ...fields,
                bankId: bank.id,
                status: input.status,
                knowledgePoints: { connect: knowledgePoints.set },
              },
            })
            return { id: question.id, message: '题目已保存' }
          }
          case 'copyQuestion': {
            const target = await editableBank(tx, actor, input.bankId)
            if (target.scope !== 'PERSONAL') throw new Error('只能复制到个人题库')
            const original = await tx.bankQuestion.findFirst({
              where: { id: input.id, status: 'READY', bank: { scope: 'PUBLIC', archived: false } },
              include: { bank: true },
            })
            if (!original) throw new Error('公共题目已停用或不存在')
            const { knowledgePoints, ...data } = await questionData(
              tx,
              target.id,
              questionContentSchema.parse(original.content)
            )
            const copy = await tx.bankQuestion.create({
              data: {
                ...data,
                bankId: target.id,
                status: 'DRAFT',
                sourceQuestionId: original.id,
                sourceBankName: original.bank.name,
                knowledgePoints: { connect: knowledgePoints.set },
              },
            })
            return { id: copy.id, message: '已复制为个人草稿，保留原题来源' }
          }
          case 'saveKnowledgePoint': {
            await editableBank(tx, actor, input.bankId)
            if (input.parentId) {
              const points = await tx.questionKnowledgePoint.findMany({ where: { bankId: input.bankId } })
              const byId = new Map(points.map((point) => [point.id, point]))
              if (!byId.has(input.parentId)) throw new Error('上级知识点不属于当前题库')
              let cursor: string | null = input.parentId
              const visited = new Set<string>()
              while (cursor) {
                if (cursor === input.id || visited.has(cursor)) throw new Error('知识点不能形成循环')
                visited.add(cursor)
                cursor = byId.get(cursor)?.parentId ?? null
              }
            }
            if (input.id) {
              const point = await tx.questionKnowledgePoint.findFirst({ where: { id: input.id, bankId: input.bankId } })
              if (!point) throw new Error('知识点不存在')
              if (point.name !== input.name) throw new Error('已有知识点名称不能更改，请新增知识点后编辑题目关联')
              await tx.questionKnowledgePoint.update({ where: { id: point.id }, data: { parentId: input.parentId } })
            } else
              await tx.questionKnowledgePoint.create({
                data: { bankId: input.bankId, name: input.name, parentId: input.parentId },
              })
            return { message: '知识点已保存' }
          }
          case 'confirmImport': {
            await editableBank(tx, actor, input.bankId)
            const hash = createHash('sha256').update(`${input.bankId}\0${input.format}\0${input.text}`).digest('hex')
            const existing = await tx.questionImportBatch.findUnique({ where: { requestKey: input.requestKey } })
            if (existing) {
              if (existing.actorId !== actor.id || existing.contentHash !== hash) throw new Error('导入请求标识冲突')
              return { id: existing.id, message: `该批次已完成，成功 ${existing.importedCount} 题，未重复导入` }
            }
            const prepared = await prepareImport(tx, input)
            if (!prepared.ready.length) throw new Error('没有可导入的新题目，请检查校验结果')
            for (const entry of prepared.ready) {
              const { knowledgePoints, ...data } = await questionData(tx, input.bankId, entry.content)
              await tx.bankQuestion.create({
                data: {
                  ...data,
                  bankId: input.bankId,
                  status: 'DRAFT',
                  knowledgePoints: { connect: knowledgePoints.set },
                },
              })
            }
            const batch = await tx.questionImportBatch.create({
              data: {
                bankId: input.bankId,
                actorId: actor.id,
                fileName: input.fileName,
                requestKey: input.requestKey,
                contentHash: hash,
                totalCount: prepared.totalCount,
                importedCount: prepared.ready.length,
                duplicateCount: prepared.duplicates.length,
                errorCount: prepared.errors.length,
                details: json({ errors: prepared.errors, duplicates: prepared.duplicates }),
              },
            })
            return {
              id: batch.id,
              message: `已导入 ${prepared.ready.length} 道草稿，跳过 ${prepared.duplicates.length} 道重复题，${prepared.errors.length} 道校验失败`,
            }
          }
          case 'savePaper':
            return savePaper(tx, actor, input)
          case 'archivePaper': {
            const updated = await tx.questionPaper.updateMany({
              where: { id: input.id, ownerId: actor.id, archived: false, version: input.version },
              data: { archived: true, version: { increment: 1 } },
            })
            if (!updated.count) throw new Error('试卷不存在、无权限或已被修改，请刷新')
            return { message: '试卷已归档' }
          }
          case 'copyPaper': {
            const original = await tx.questionPaper.findFirst({
              where: { id: input.id, ownerId: actor.id, archived: false },
              include: paperInclude,
            })
            if (!original) throw new Error('试卷不存在或没有访问权限')
            const copy = await tx.questionPaper.create({
              data: {
                ownerId: actor.id,
                title: `${original.title.slice(0, 140)}（副本）`,
                instructions: original.instructions,
                sections: {
                  create: original.sections.map((section) => ({
                    title: section.title,
                    position: section.position,
                    items: {
                      create: section.items.map((item) => ({
                        sourceQuestionId: item.sourceQuestionId,
                        sourceBankName: item.sourceBankName,
                        snapshot: json(item.snapshot),
                        score: item.score,
                        answerLines: item.answerLines,
                        position: item.position,
                      })),
                    },
                  })),
                },
              },
            })
            return { id: copy.id, message: '试卷已复制，保留原有题目快照' }
          }
        }
      },
      { timeout: 30_000 }
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error('内容重复或请求已被处理，请刷新后重试；已有内容不会被覆盖')
    }
    throw error
  }
}

export const QuestionBankService = { bootstrap, search, listPapers, getQuestion, getPaper, previewImport, command }
