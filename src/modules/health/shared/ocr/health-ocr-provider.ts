export interface HealthOcrInput {
  readonly text?: string
  readonly sourceFileName?: string
}

export interface HealthOcrResult {
  readonly text: string
  readonly sourceFileName?: string
}

export interface HealthOcrProvider {
  extractText(input: HealthOcrInput): Promise<HealthOcrResult>
}
