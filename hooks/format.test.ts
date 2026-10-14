import { describe, expect, test } from 'claude-code/testing'

import { LAYOUTS, countdown, fit, folderName, levelColor, meter, modelName, widthOf } from './format'

describe('format', () => {
  test('model names', async () => {
    expect(modelName('claude-opus-5-5')).toBe('Opus 5.5')
    expect(modelName('claude-sonnet-5-5[1m]')).toBe('Sonnet 5.5')
    expect(modelName('claude-haiku-4-5-20251001')).toBe('Haiku 4.5')
    expect(modelName('claude-fable-5-1')).toBe('Fable 5.1')
    expect(modelName('opus')).toBe('opus')
  })

  test('folders', async () => {
    expect(folderName('/home/me', '/home/me')).toBe('~')
    expect(folderName('/home/me/Work', '/home/me')).toBe('~/Work')
    expect(folderName('/home/me/minecraft_mods/groundworks', '/home/me')).toBe('~/minecraft_mods/groundworks')
    expect(folderName('/home/me/a/b/c', '/home/me')).toBe('…/b/c')
    expect(folderName('/home/meow/x', '/home/me')).toBe('/home/meow/x')
  })

  test('meters and levels', async () => {
    expect(meter(0)).toEqual({ full: '', empty: '▱▱▱▱▱▱▱▱' })
    expect(meter(50)).toEqual({ full: '▰▰▰▰', empty: '▱▱▱▱' })
    expect(meter(130).full).toBe('▰▰▰▰▰▰▰▰')
    expect([levelColor(10), levelColor(50), levelColor(80)]).toEqual(['success', 'warning', 'error'])
  })

  test('countdowns', async () => {
    const now = Date.parse('2026-10-14T10:00:00Z')
    expect(countdown('2026-10-14T10:42:00Z', now)).toBe('42m')
    expect(countdown('2026-10-14T12:14:00Z', now)).toBe('2h14m')
    expect(countdown('2026-10-17T14:00:00Z', now)).toBe('3d4h')
    expect(countdown('2026-10-14T09:00:00Z', now)).toBeUndefined()
    expect(countdown(undefined, now)).toBeUndefined()
  })
})

describe('fit', () => {
  // The band in the screenshot: about 95 columns for its body.
  const band = {
    folder: '~/minecraft_mods/groundworks',
    branch: 'main',
    model: '◆ Opus 5.5 medium',
    gauges: [
      { label: 'ctx', value: '18%' },
      { label: '5h', value: '18%', left: '1h26m' },
      { label: '7d', value: '28%', left: '5d3h' },
    ],
  }

  test('a wide window keeps the full band', async () => {
    expect(fit(band, 200)).toEqual({ cells: 8, gap: 3, isFolderShort: false })
  })

  test('a 95-column band fits on one row', async () => {
    const layout = fit(band, 95)
    expect(widthOf(band, layout)).toBeLessThanOrEqual(95)
  })

  test('too narrow for any layout takes the last, which wraps', async () => {
    expect(fit(band, 20)).toEqual(LAYOUTS.at(-1))
  })
})
