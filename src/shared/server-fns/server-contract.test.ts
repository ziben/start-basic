import { z } from 'zod'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { describe, expect, it, vi } from 'vitest'
import { createSafeErrorResponse } from '../utils/safe-error-response'
import { ServiceError, toSafeError } from '../utils/service-error'

describe('server contracts', () => {
  it('requires a Zod validator on every Server Function', () => {
    const violations: string[] = []
    const root = join(process.cwd(), 'src')
    for (const path of readdirSync(root, { recursive: true }) as string[]) {
      if (!/\.tsx?$/.test(path) || path.includes('.test.') || path.startsWith('test')) continue
      const source = readFileSync(join(root, path), 'utf8')
      if (!source.includes('createServerFn')) continue
      const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true)
      const visit = (node: ts.Node) => {
        if (ts.isVariableDeclaration(node) && node.initializer?.getText(file).startsWith('createServerFn(')) {
          let current: ts.Node = node.initializer
          let validator: ts.Expression | undefined
          while (ts.isCallExpression(current) && ts.isPropertyAccessExpression(current.expression)) {
            if (current.expression.name.text === 'validator') validator = current.arguments[0]
            current = current.expression.expression
          }
          const text = validator?.getText(file) ?? ''
          if (!text || !(/^z\s*\./.test(text) || /Schema(?:\.|$)/.test(text))) {
            violations.push(`${path}: ${node.name.getText(file)}`)
          }
        }
        ts.forEachChild(node, visit)
      }
      visit(file)
    }
    expect(violations).toEqual([])
  })

  it('normalizes Zod and Standard Schema validation without exposing input', () => {
    const result = z.object({ id: z.string() }).safeParse({ id: 123 })
    if (result.success) throw new Error('Expected invalid input')
    expect(toSafeError(result.error)).toMatchObject({ code: 'BAD_REQUEST', status: 400 })
    expect(toSafeError(new Error(JSON.stringify(result.error.issues)))).toEqual(toSafeError(result.error))
    expect(toSafeError(new Error('[internal connection secret]')).code).toBe('INTERNAL_ERROR')
  })

  it('preserves explicit auth errors and hides internal errors', async () => {
    expect(toSafeError(new ServiceError('UNAUTHORIZED'))).toMatchObject({ code: 'UNAUTHORIZED', status: 401 })
    expect(toSafeError(new ServiceError('FORBIDDEN'))).toMatchObject({ code: 'FORBIDDEN', status: 403 })
    expect(toSafeError({ code: 'P2002', message: 'database secret' })).toMatchObject({ code: 'CONFLICT', status: 409 })
    const error = new Error('postgres://secret')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const response = createSafeErrorResponse(error)
      expect(response.status).toBe(500)
      expect(await response.json()).toEqual(toSafeError(error))
      expect(JSON.stringify(toSafeError(error))).not.toContain('secret')
    } finally {
      spy.mockRestore()
    }
  })
})
