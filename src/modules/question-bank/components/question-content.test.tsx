import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { blankQuestion, type QuestionContent } from '../shared/domain'
import { QuestionContentView, QuestionMarkdown, questionUrlTransform } from './question-content'

describe('safe question rendering', () => {
  it('renders native MathML fractions, roots and superscripts without external scripts', () => {
    const html = renderToStaticMarkup(
      <QuestionMarkdown
        content={
          '分式 <math><mfrac><mi>a</mi><mi>b</mi></mfrac><msqrt><mi>x</mi></msqrt><msup><mi>x</mi><mn>2</mn></msup></math>'
        }
      />
    )
    expect(html).toContain('<math>')
    expect(html).toContain('<mfrac>')
    expect(html).toContain('<msqrt>')
    expect(html).toContain('<msup>')
    expect(html).not.toContain('<script')
  })
  it('removes active HTML, unsafe links and event handlers, including in MathML', () => {
    const html = renderToStaticMarkup(
      <QuestionMarkdown
        content={
          '<script>alert(1)</script><iframe src="https://evil.example"></iframe><math href="javascript:alert(1)" onclick="alert(1)"><mi style="color:red" onclick="alert(1)">x</mi><annotation-xml><svg onload="alert(1)"></svg></annotation-xml></math><a href="javascript:alert(1)" onclick="alert(1)">链接</a>'
        }
      />
    )
    expect(html).not.toMatch(/<script|<iframe|<svg|onclick|onload|javascript:|style=/)
    expect(html).toContain('<mi>x</mi>')
  })
  it('allows embedded raster images but blocks mutable external images and SVG data', () => {
    expect(questionUrlTransform('data:image/png;base64,aGVsbG8=', 'src')).toContain('data:image/png')
    expect(questionUrlTransform('https://example.com/changing.png', 'src')).toBe('')
    expect(questionUrlTransform('data:image/svg+xml;base64,aGVsbG8=', 'src')).toBe('')
  })
  it('omits answers and explanations in the student variant, including all subquestions', () => {
    const content: QuestionContent = {
      ...blankQuestion(),
      type: 'COMPOSITE',
      stem: '共同材料',
      subject: '数学',
      children: [
        { type: 'SHORT', stem: '小题一', answer: '秘密答案甲', explanation: '秘密解析甲', options: [] },
        { type: 'SHORT', stem: '小题二', answer: '秘密答案乙', explanation: '秘密解析乙', options: [] },
      ],
    }
    const student = renderToStaticMarkup(<QuestionContentView content={content} />)
    expect(student).toContain('共同材料')
    expect(student).toContain('小题一')
    expect(student).not.toContain('秘密')
    const teacher = renderToStaticMarkup(<QuestionContentView content={content} answers />)
    expect(teacher).toContain('秘密答案甲')
    expect(teacher).toContain('秘密解析乙')
  })
})
