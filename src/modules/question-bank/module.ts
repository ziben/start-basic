import { defineModule } from '~/core/module-registry'
import { QuestionBankService } from './shared/services/question-bank.service'

export const questionBankModule = defineModule({
  key: 'question-bank',
  version: '1.0.0',
  dependencies: ['auth'],
  exports: { services: { QuestionBankService } },
})
