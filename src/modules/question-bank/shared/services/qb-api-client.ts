import { fetchJson, fetchText } from '@/shared/lib/fetch-utils'

export interface Category {
  id: string
  name: string
  description: string | null
  orderIndex: number
  depth: number
  parentId: string | null
  createdAt: string
  updatedAt: string
  children?: Category[]
}

export interface CreateCategoryData {
  name: string
  description?: string
  parentId?: string | null
  orderIndex?: number
}

export interface UpdateCategoryData {
  name?: string
  description?: string | null
  parentId?: string | null
  orderIndex?: number
}

export interface Question {
  id: string
  type: string
  content: string
  options: any
  answer: any
  explanation: string | null
  difficulty: number
  categoryId: string | null
  category?: Category
  createdAt: string
  updatedAt: string
}

export interface CreateQuestionData {
  type: string
  content: string
  options?: any
  answer: any
  explanation?: string
  difficulty?: number
  categoryId?: string | null
  tagIds?: string[]
}

export interface UpdateQuestionData {
  type?: string
  content?: string
  options?: any
  answer?: any
  explanation?: string | null
  difficulty?: number
  categoryId?: string | null
  tagIds?: string[]
}

export interface Tag {
  id: string
  name: string
  color: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTagData {
  name: string
  color?: string
}

export interface UpdateTagData {
  name?: string
  color?: string | null
}

const BASE_URL = '/api/question-bank'

export const qbApiClient = {
  categories: {
    list: (params?: { tree?: boolean }) => {
      const qs = new URLSearchParams()
      if (params?.tree) qs.set('tree', '1')
      const url = qs.toString() ? `${BASE_URL}/categories?${qs.toString()}` : `${BASE_URL}/categories`
      return fetchJson<Category[]>(url)
    },
    get: (id: string) => 
      fetchJson<Category>(`${BASE_URL}/categories/${id}`),
    
    create: (data: CreateCategoryData) => 
      fetchJson<Category>(`${BASE_URL}/categories`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: UpdateCategoryData) => 
      fetchJson<Category>(`${BASE_URL}/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) => 
      fetchText(`${BASE_URL}/categories/${id}`, {
        method: 'DELETE',
      }),
  },
  questions: {
    list: (params?: { categoryId?: string; type?: string; q?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams()
      if (params?.categoryId) qs.set('categoryId', params.categoryId)
      if (params?.type) qs.set('type', params.type)
      if (params?.q) qs.set('q', params.q)
      if (params?.page) qs.set('page', params.page.toString())
      if (params?.limit) qs.set('limit', params.limit.toString())
      const url = qs.toString() ? `${BASE_URL}/questions?${qs.toString()}` : `${BASE_URL}/questions`
      return fetchJson<{ items: Question[]; total: number }>(url)
    },
    get: (id: string) => 
      fetchJson<Question>(`${BASE_URL}/questions/${id}`),
    
    create: (data: CreateQuestionData) => 
      fetchJson<Question>(`${BASE_URL}/questions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: UpdateQuestionData) => 
      fetchJson<Question>(`${BASE_URL}/questions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) => 
      fetchText(`${BASE_URL}/questions/${id}`, {
        method: 'DELETE',
      }),
  },
  tags: {
    list: () => 
      fetchJson<Tag[]>(`${BASE_URL}/tags`),
    get: (id: string) => 
      fetchJson<Tag>(`${BASE_URL}/tags/${id}`),
    create: (data: CreateTagData) => 
      fetchJson<Tag>(`${BASE_URL}/tags`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateTagData) => 
      fetchJson<Tag>(`${BASE_URL}/tags/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => 
      fetchText(`${BASE_URL}/tags/${id}`, {
        method: 'DELETE',
      }),
  },
} as const





