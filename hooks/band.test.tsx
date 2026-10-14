import { expect, test } from 'claude-code/testing'

const BAND = {
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 120,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

test('the band shows context and limits as they are measured', async ($, on) => {
  on('session.measure', ($, e) => ({ changed: e.changed }))
  await $.session.measure({
    context: { window: 200_000, tokens: 68_000, percent: 34 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 85 },
      { kind: 'seven_day', percentUsed: 9 },
    ],
    changed: ['context', 'rateLimits'],
  })

  const ui = await $.ui.mount({ plugin: 'status-band', surface: 'terminal', ...BAND })

  expect((await ui.find({ type: 'Box' }))?.text).toBe('ctx ▰▰▰▱▱▱▱▱ 34%5h ▰▰▰▰▰▰▰▱ 85%7d ▰▱▱▱▱▱▱▱ 9%')
  expect((await ui.find({ type: 'Text', text: /^ 85%$/ }))?.props.color).toBe('error')
  expect((await ui.find({ type: 'Text', text: /^ 34%$/ }))?.props.color).toBe('success')
})
