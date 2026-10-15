import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
import { requireUser } from '~/modules/auth/shared/lib/require-auth'
import { commandSchema, idSchema, importInputSchema, questionSearchSchema } from '../domain'

export const questionBankBootstrapFn = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await requireUser()
  const { QuestionBankService } = await import('../services/question-bank.service')
  return QuestionBankService.bootstrap(user)
})

export const searchBankQuestionsFn = createServerFn({ method: 'GET' })
  .validator(questionSearchSchema)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const { QuestionBankService } = await import('../services/question-bank.service')
    return QuestionBankService.search(user, data)
  })

export const getBankQuestionFn = createServerFn({ method: 'GET' })
  .validator(z.object({ id: idSchema }))
  .handler(async ({ data }) => {
    const user = await requireUser()
    const { QuestionBankService } = await import('../services/question-bank.service')
    return QuestionBankService.getQuestion(user, data.id)
  })

export const getQuestionPaperFn = createServerFn({ method: 'GET' })
  .validator(z.object({ id: idSchema }))
  .handler(async ({ data }) => {
    const user = await requireUser()
    const { QuestionBankService } = await import('../services/question-bank.service')
    return QuestionBankService.getPaper(user, data.id)
  })

export const previewQuestionImportFn = createServerFn({ method: 'POST' })
  .validator(importInputSchema)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const { QuestionBankService } = await import('../services/question-bank.service')
    return QuestionBankService.previewImport(user, data)
  })

export const questionBankCommandFn = createServerFn({ method: 'POST' })
  .validator(commandSchema)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const { QuestionBankService } = await import('../services/question-bank.service')
    return QuestionBankService.command(user, data)
  })
