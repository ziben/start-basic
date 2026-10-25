import { z } from 'zod'

export const questionTypes = {
  SINGLE: '单选题',
  MULTIPLE: '多选题',
  TRUE_FALSE: '判断题',
  FILL: '填空题',
  SHORT: '解答题',
  COMPOSITE: '组合题',
} as const
export const statusLabels = { DRAFT: '草稿', READY: '可用', DISABLED: '停用' } as const
export const stageLabels = { JUNIOR: '初中', SENIOR: '高中' } as const
export const idSchema = z.string().min(1).max(100)
const text = z.string().trim()
const optionSchema = z.object({
  key: text.min(1).max(5),
  text: text.min(1).max(100_000),
})
const partShape = {
  type: z.enum(['SINGLE', 'MULTIPLE', 'TRUE_FALSE', 'FILL', 'SHORT']),
  stem: text.min(1, '题干不能为空').max(500_000),
  options: z.array(optionSchema).max(26).default([]),
  answer: text.max(100_000).default(''),
  explanation: text.max(200_000).default(''),
}
export const questionContentSchema = z
  .object({
    ...partShape,
    type: z.enum(['SINGLE', 'MULTIPLE', 'TRUE_FALSE', 'FILL', 'SHORT', 'COMPOSITE']),
    stage: z.enum(['JUNIOR', 'SENIOR']),
    grade: text.max(20).default(''),
    subject: text.min(1, '请填写学科').max(40),
    difficulty: z.number().int().min(1).max(5).default(3),
    textbook: text.max(100).default(''),
    chapter: text.max(100).default(''),
    knowledgePoints: z.array(text.min(1).max(80)).max(30).default([]),
    source: text.max(500).default(''),
    usageRights: text.max(500).default(''),
    children: z.array(z.object(partShape)).max(30).default([]),
  })
  .superRefine((value, ctx) => {
    const parts = value.type === 'COMPOSITE' ? value.children : [value]
    if (value.type === 'COMPOSITE' && !value.children.length) {
      ctx.addIssue({ code: 'custom', path: ['children'], message: '组合题至少需要一道小题' })
    }
    if (value.type !== 'COMPOSITE' && value.children.length) {
      ctx.addIssue({ code: 'custom', path: ['children'], message: '只有组合题可以包含小题' })
    }
    for (const [index, part] of parts.entries()) {
      const path = value.type === 'COMPOSITE' ? ['children', index] : []
      if (new Set(part.options.map((option) => option.key)).size !== part.options.length) {
        ctx.addIssue({ code: 'custom', path: [...path, 'options'], message: '选项标识不能重复' })
      }
      if (['SINGLE', 'MULTIPLE'].includes(part.type) && part.options.length < 2) {
        ctx.addIssue({ code: 'custom', path: [...path, 'options'], message: '选择题至少需要两个选项' })
      }
      if (part.answer && ['SINGLE', 'MULTIPLE'].includes(part.type)) {
        const answers = part.answer.split(/[,，、\s]+/).filter(Boolean)
        if (
          (part.type === 'SINGLE' && answers.length !== 1) ||
          !answers.length ||
          answers.some((answer) => !part.options.some((option) => option.key === answer)) ||
          new Set(answers).size !== answers.length
        ) {
          ctx.addIssue({
            code: 'custom',
            path: [...path, 'answer'],
            message: '答案必须使用已有选项标识；多选使用逗号分隔',
          })
        }
      }
      if (part.type === 'TRUE_FALSE' && part.answer && !['正确', '错误'].includes(part.answer)) {
        ctx.addIssue({ code: 'custom', path: [...path, 'answer'], message: '判断题答案填写“正确”或“错误”' })
      }
    }
    if (JSON.stringify(value).length > 900_000) {
      ctx.addIssue({ code: 'custom', message: '单道题目内容过大，请压缩图片' })
    }
  })
export type QuestionContent = z.infer<typeof questionContentSchema>
export type QuestionPart = QuestionContent['children'][number]
export type QuestionActor = { id: string; role?: string | null }

export function canManagePublic(actor: QuestionActor): boolean {
  return (actor.role ?? '')
    .split(',')
    .some((role) => ['admin', 'superadmin', 'question-bank-maintainer'].includes(role.trim().replace(/^GLOBAL:/, '')))
}

export function assertPublishable(content: QuestionContent, isPublic: boolean): void {
  const parts = content.type === 'COMPOSITE' ? content.children : [content]
  if (parts.some((part) => !part.answer.trim())) throw new Error('设为可用前，请填写所有题目的答案')
  if (isPublic && (!content.source.trim() || !content.usageRights.trim())) {
    throw new Error('公共题目发布前必须填写出处和使用授权说明')
  }
}

export const bankInputSchema = z.object({
  id: idSchema.optional(),
  version: z.number().int().positive().optional(),
  name: text.min(1).max(100),
  description: text.max(500).default(''),
  scope: z.enum(['PERSONAL', 'PUBLIC']),
})
export const questionInputSchema = z.object({
  id: idSchema.optional(),
  version: z.number().int().positive().optional(),
  bankId: idSchema,
  content: questionContentSchema,
  status: z.enum(['DRAFT', 'READY', 'DISABLED']).default('DRAFT'),
})
export const questionSearchSchema = z.object({
  scope: z.enum(['PERSONAL', 'PUBLIC']).default('PERSONAL'),
  maintenance: z.boolean().default(false),
  bankId: idSchema.optional(),
  keyword: text.max(100).default(''),
  subject: text.max(40).default(''),
  stage: z.enum(['', 'JUNIOR', 'SENIOR']).default(''),
  grade: text.max(20).default(''),
  type: z.enum(['', 'SINGLE', 'MULTIPLE', 'TRUE_FALSE', 'FILL', 'SHORT', 'COMPOSITE']).default(''),
  knowledgePoint: text.max(80).default(''),
  difficulty: z.number().int().min(1).max(5).optional(),
  status: z.enum(['', 'DRAFT', 'READY', 'DISABLED']).default(''),
  page: z.number().int().min(1).max(100_000).default(1),
})
export const paperSearchSchema = z.object({
  page: z.number().int().min(1).max(100_000).default(1),
  pageSize: z.number().int().min(1).max(50).default(10),
  filter: text.max(100).default(''),
})
export const paperInputSchema = z
  .object({
    id: idSchema.optional(),
    version: z.number().int().positive().optional(),
    title: text.min(1).max(150),
    instructions: text.max(2000).default(''),
    sections: z
      .array(
        z.object({
          title: text.min(1).max(100),
          items: z
            .array(
              z.object({
                id: idSchema.optional(),
                questionId: idSchema,
                score: z
                  .number()
                  .finite()
                  .min(0)
                  .max(9999)
                  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001, '分值最多两位小数'),
                answerLines: z.number().int().min(0).max(30).default(3),
              })
            )
            .max(100),
        })
      )
      .min(1)
      .max(20),
  })
  .superRefine((value, ctx) => {
    const items = value.sections.flatMap((section) => section.items)
    if (!items.length || items.length > 100) {
      ctx.addIssue({ code: 'custom', message: '每份试卷需要 1 至 100 道题目' })
    }
    if (new Set(items.map((item) => item.questionId)).size !== items.length) {
      ctx.addIssue({ code: 'custom', message: '试卷中不能重复添加同一道题目' })
    }
  })
export const importInputSchema = z.object({
  bankId: idSchema,
  fileName: text.min(1).max(200),
  format: z.enum(['csv', 'json']),
  text: z.string().min(1).max(5_000_000),
})
export const commandSchema = z.discriminatedUnion('action', [
  bankInputSchema.extend({ action: z.literal('saveBank') }),
  z.object({ action: z.literal('archiveBank'), id: idSchema, version: z.number().int().positive() }),
  questionInputSchema.extend({ action: z.literal('saveQuestion') }),
  z.object({ action: z.literal('copyQuestion'), id: idSchema, bankId: idSchema }),
  paperInputSchema.safeExtend({ action: z.literal('savePaper') }),
  z.object({ action: z.literal('archivePaper'), id: idSchema, version: z.number().int().positive() }),
  z.object({ action: z.literal('copyPaper'), id: idSchema }),
  importInputSchema.extend({ action: z.literal('confirmImport'), requestKey: z.string().uuid() }),
  z.object({
    action: z.literal('saveKnowledgePoint'),
    bankId: idSchema,
    name: text.min(1).max(80),
    id: idSchema.optional(),
    parentId: idSchema.nullable().default(null),
  }),
])
export type QuestionCommand = z.infer<typeof commandSchema>

export function blankQuestion(): QuestionContent {
  return {
    type: 'SHORT',
    stem: '',
    options: [],
    answer: '',
    explanation: '',
    stage: 'JUNIOR',
    grade: '',
    subject: '',
    difficulty: 3,
    textbook: '',
    chapter: '',
    knowledgePoints: [],
    source: '',
    usageRights: '',
    children: [],
  }
}
