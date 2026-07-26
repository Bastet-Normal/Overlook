import { describe, expect, it } from 'vitest'

import { buildImportMapping, isValidCalendarDate, parseImportedRow } from './importHelpers'

describe('CSV import safeguards', () => {
  it('validates actual dates rather than only their text shape', () => {
    expect(isValidCalendarDate('2026-02-28')).toBe(true)
    expect(isValidCalendarDate('2026-02-31')).toBe(false)
  })

  it('clamps imported negative metrics to zero', () => {
    const row = {
      平台: 'Bilibili',
      标题: '测试内容',
      日期: '2026-07-25',
      播放量: '-100',
    }
    const mapping = buildImportMapping(Object.keys(row))
    const parsed = parseImportedRow(row, 0, new Set(), mapping.mappings)

    expect(parsed.item?.views).toBe(0)
  })
})
