import type { HealthOcrInput, HealthOcrProvider, HealthOcrResult } from './health-ocr-provider'

export class ManualTextOcrProvider implements HealthOcrProvider {
  async extractText(input: HealthOcrInput): Promise<HealthOcrResult> {
    const text = input.text?.trim()

    if (!text) {
      throw new Error('请粘贴体检报告 OCR 文本')
    }

    return {
      text,
      sourceFileName: input.sourceFileName?.trim() || undefined,
    }
  }
}
