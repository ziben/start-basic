import { describe, expect, it } from 'vitest'
import { ManualTextOcrProvider } from './manual-text-ocr-provider'
import { parseHealthReportText } from './parse-health-report-text'

describe('parseHealthReportText', () => {
  it('extracts numeric health metrics from common OCR lines', () => {
    const metrics = parseHealthReportText(`
      项目 结果 单位 参考范围
      白细胞 6.21 10^9/L 3.5-9.5 正常
      谷丙转氨酶 58 U/L 0-40 偏高
      血红蛋白 118 g/L 130-175 偏低
    `)

    expect(metrics).toHaveLength(3)
    expect(metrics[0]).toMatchObject({
      rawName: '白细胞',
      valueText: '6.21',
      numericValue: 6.21,
      unit: '10^9/L',
      referenceRange: '3.5-9.5',
      flag: 'NORMAL',
    })
    expect(metrics[1]).toMatchObject({ rawName: '谷丙转氨酶', flag: 'HIGH' })
    expect(metrics[2]).toMatchObject({ rawName: '血红蛋白', flag: 'LOW' })
  })

  it('supports qualitative results', () => {
    const metrics = parseHealthReportText('尿蛋白 阴性 阴性 正常\n幽门螺杆菌 阳性 阴性 异常')

    expect(metrics).toHaveLength(2)
    expect(metrics[0]).toMatchObject({ rawName: '尿蛋白', valueText: '阴性', flag: 'NORMAL' })
    expect(metrics[1]).toMatchObject({ rawName: '幽门螺杆菌', valueText: '阳性', flag: 'ABNORMAL' })
  })
})

describe('ManualTextOcrProvider', () => {
  it('returns trimmed manual OCR text', async () => {
    const provider = new ManualTextOcrProvider()

    await expect(provider.extractText({ text: ' 白细胞 6.21 ' })).resolves.toEqual({
      text: '白细胞 6.21',
      sourceFileName: undefined,
    })
  })

  it('rejects empty OCR text', async () => {
    const provider = new ManualTextOcrProvider()

    await expect(provider.extractText({ text: '   ' })).rejects.toThrow('请粘贴体检报告 OCR 文本')
  })
})
