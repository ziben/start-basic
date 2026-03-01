export type Translation = {
  id: string
  locale: string
  key: string
  value: string
  createdAt: Date
}

export type TranslationImportResult = { inserted: number; updated: number }
