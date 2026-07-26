import { describe, expect, it } from 'vitest'

import { buildInsightList, buildPlatformSummaries, getBestSlots } from './calendarHelpers'
import { seedGoal } from './mockData'

describe('dashboard recommendations', () => {
  it('labels default time slots as recommendations', () => {
    expect(getBestSlots([], 'Bilibili').every((slot) => slot.source === 'recommended')).toBe(true)
  })

  it('does not claim a best-performing platform when there is no content', () => {
    const insights = buildInsightList(
      buildPlatformSummaries([]),
      [],
      [],
      seedGoal,
      getBestSlots([], 'Bilibili'),
    )

    expect(insights.some((insight) => insight.includes('互动率最高'))).toBe(false)
    expect(insights.some((insight) => insight.includes('暂无足够历史样本'))).toBe(true)
  })
})
