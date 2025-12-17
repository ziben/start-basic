import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiError, fetchJson, fetchJsonWithSchema, fetchText } from './api-client'
import { z } from 'zod'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('api-client', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('ApiError', () => {
    it('should create an error with message and status', () => {
      const error = new ApiError('Not found', 404)
      expect(error.message).toBe('Not found')
      expect(error.status).toBe(404)
      expect(error.name).toBe('ApiError')
    })

    it('should create an error without status', () => {
      const error = new ApiError('Unknown error')
      expect(error.message).toBe('Unknown error')
      expect(error.status).toBeUndefined()
    })
  })

  describe('fetchJson', () => {
    it('should return JSON data on success', async () => {
      const mockData = { id: 1, name: 'Test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await fetchJson<typeof mockData>('/api/test')
      expect(result).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith('/api/test', undefined)
    })

    it('should pass RequestInit options', async () => {
      const mockData = { success: true }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      await fetchJson('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: 'test' }),
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: 'test' }),
      })
    })

    it('should throw ApiError on failure with JSON error body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Validation failed' }),
      })

      try {
        await fetchJson('/api/test')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).status).toBe(400)
      }
    })

    it('should throw ApiError on failure with text error body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Server error occurred',
      })

      await expect(fetchJson('/api/test')).rejects.toThrow(ApiError)
    })

    it('should use statusText when body cannot be read', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers(),
        text: async () => { throw new Error('Cannot read') },
      })

      await expect(fetchJson('/api/test')).rejects.toThrow(ApiError)
    })
  })

  describe('fetchJsonWithSchema', () => {
    const testSchema = z.object({
      id: z.number(),
      name: z.string(),
    })

    it('should validate and return data matching schema', async () => {
      const mockData = { id: 1, name: 'Test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await fetchJsonWithSchema(testSchema, '/api/test')
      expect(result).toEqual(mockData)
    })

    it('should throw on schema validation failure', async () => {
      const invalidData = { id: 'not-a-number', name: 123 }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidData,
      })

      await expect(fetchJsonWithSchema(testSchema, '/api/test')).rejects.toThrow()
    })
  })

  describe('fetchText', () => {
    it('should return text on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'Hello, World!',
      })

      const result = await fetchText('/api/text')
      expect(result).toBe('Hello, World!')
    })

    it('should throw ApiError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        text: async () => 'Resource not found',
      })

      await expect(fetchText('/api/text')).rejects.toThrow(ApiError)
    })
  })
})
