import { describe, expect, it } from 'vitest'
import {
  assertPublishable,
  blankQuestion,
  canManagePublic,
  commandSchema,
  paperInputSchema,
  questionContentSchema,
} from './domain'
import { csvTemplate, jsonTemplate, parseCsv, parseQuestionImport } from './import-format'

const valid = () => questionContentSchema.parse({ ...blankQuestion(), stem: '计算 1+1', subject: '数学', answer: '2' })

describe('question content and authority', () => {
  it.each(['admin', 'user, superadmin', 'GLOBAL:question-bank-maintainer'])(
    'accepts exact maintainer roles: %s',
    (role) => {
      expect(canManagePublic({ id: 'u', role })).toBe(true)
    }
  )
  it.each(['user', 'notadmin', 'admin-assistant', 'ORGANIZATION:admin', '', null])(
    'rejects role substring escalation: %s',
    (role) => {
      expect(canManagePublic({ id: 'u', role })).toBe(false)
    }
  )
  it('requires answers before use, and provenance before public publication', () => {
    expect(() => assertPublishable({ ...valid(), answer: '' }, false)).toThrow('答案')
    expect(() => assertPublishable(valid(), true)).toThrow('授权')
    expect(() => assertPublishable({ ...valid(), source: '自编', usageRights: '允许教学使用' }, true)).not.toThrow()
  })
  it('requires composite subquestions and checks each answer', () => {
    expect(questionContentSchema.safeParse({ ...valid(), type: 'COMPOSITE' }).success).toBe(false)
    const content = questionContentSchema.parse({
      ...valid(),
      type: 'COMPOSITE',
      children: [{ type: 'SHORT', stem: '第一个问题', answer: '' }],
    })
    expect(() => assertPublishable(content, false)).toThrow('答案')
  })
  it('rejects invalid option keys and duplicate choices without preventing incomplete drafts', () => {
    const choice = {
      ...valid(),
      type: 'SINGLE',
      options: [
        { key: 'A', text: '1' },
        { key: 'B', text: '2' },
      ],
    }
    expect(questionContentSchema.safeParse({ ...choice, answer: '' }).success).toBe(true)
    expect(questionContentSchema.safeParse({ ...choice, answer: 'C' }).success).toBe(false)
    expect(questionContentSchema.safeParse({ ...choice, answer: 'A,B' }).success).toBe(false)
    expect(questionContentSchema.safeParse({ ...choice, type: 'MULTIPLE', answer: 'A,B' }).success).toBe(true)
    expect(questionContentSchema.safeParse({ ...choice, type: 'MULTIPLE', answer: 'A,A' }).success).toBe(false)
  })
  it('strips client-supplied ownership and snapshots from commands', () => {
    const command = commandSchema.parse({
      action: 'saveBank',
      name: '私人',
      scope: 'PERSONAL',
      ownerId: 'victim',
      role: 'admin',
    })
    expect(command).not.toHaveProperty('ownerId')
    expect(command).not.toHaveProperty('role')
    const paper = paperInputSchema.parse({
      title: '练习',
      sections: [{ title: '一', items: [{ questionId: 'q', score: 1.25, snapshot: valid() }] }],
    })
    expect(paper.sections[0].items[0]).not.toHaveProperty('snapshot')
  })
  it('rejects empty papers, duplicate questions and fractions of a cent', () => {
    const base = { title: '练习', sections: [{ title: '一', items: [] }] }
    expect(paperInputSchema.safeParse(base).success).toBe(false)
    const item = { questionId: 'q', score: 1.25 }
    expect(paperInputSchema.safeParse({ ...base, sections: [{ title: '一', items: [item, item] }] }).success).toBe(
      false
    )
    expect(
      paperInputSchema.safeParse({ ...base, sections: [{ title: '一', items: [{ ...item, score: 1.001 }] }] }).success
    ).toBe(false)
  })
})

describe('structured imports', () => {
  it('accepts both downloadable templates, preserving material and subquestions', () => {
    expect(parseQuestionImport(csvTemplate, 'csv').valid).toHaveLength(1)
    const result = parseQuestionImport(jsonTemplate, 'json')
    expect(result.errors).toEqual([])
    expect(result.valid[0].content.type).toBe('COMPOSITE')
    expect(result.valid[0].content.children[0].answer).toBe('5 本')
  })
  it('parses quoted commas, escaped quotes, CRLF and multiline fields', () => {
    expect(parseCsv('\uFEFFa,b\r\n"一,二","他说""好""\r\n下一行"\r\n')).toEqual([
      ['a', 'b'],
      ['一,二', '他说"好"\n下一行'],
    ])
  })
  it.each(['a,b\n"x,y', 'a,b\nx"y,z', 'a,b\n"x"extra,z'])(
    'rejects malformed CSV rather than silently shifting columns',
    (source) => {
      expect(() => parseCsv(source)).toThrow('CSV')
    }
  )
  it('reports bad rows while retaining valid rows and their source positions', () => {
    const source = 'type,stem,stage,subject,answer\nSHORT,题目,JUNIOR,数学,2\nSHORT,,JUNIOR,数学,3\nSHORT,错列,JUNIOR\n'
    const result = parseQuestionImport(source, 'csv')
    expect(result.totalCount).toBe(3)
    expect(result.valid.map((entry) => entry.row)).toEqual([2])
    expect(result.errors.map((entry) => entry.row)).toEqual([3, 4])
  })
  it('rejects unknown or duplicate headers and excessive row counts', () => {
    expect(() => parseQuestionImport('type,type\nSHORT,SHORT', 'csv')).toThrow('重复')
    expect(() => parseQuestionImport('type,stem,stage,subject,stme\nSHORT,a,JUNIOR,数学,x', 'csv')).toThrow('未知')
    expect(() => parseQuestionImport(JSON.stringify(Array.from({ length: 201 }, valid)), 'json')).toThrow('200')
    expect(() => parseQuestionImport('{}', 'json')).toThrow('数组')
  })
})
