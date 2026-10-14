import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Git, Usage } from '../types'
import { LIMIT_LABELS, countdown, folderName, levelColor, meter, modelName } from './format'

const cwd = atom({ plugin: 'status-band', key: 'cwd' } as const, null)
const git = atom({ plugin: 'status-band', key: 'git' } as const, null)
const model = atom({ plugin: 'status-band', key: 'model' } as const, null)
const effort = atom({ plugin: 'status-band', key: 'effort' } as const, null)
const usage = atom({ plugin: 'status-band', key: 'usage' } as const, { limits: [] })
const now = atom({ plugin: 'status-band', key: 'now' } as const, 0)

function usageOf(e: { context: { percent?: number }; rateLimits: readonly Usage['limits'][number][] }): Usage {
  return {
    contextPercent: e.context.percent,
    limits: e.rateLimits.map(({ kind, percentUsed, resetsAt }) => ({ kind, percentUsed, resetsAt })),
  }
}

async function lookUpGit($: EngineInterface): Promise<Git | null> {
  const { exitCode, stdout } = await $.process.run(['git', 'status', '--porcelain', '--branch'])

  if (exitCode !== 0) {
    return null
  }

  const [head = '', ...changes] = stdout.split('\n').filter(line => line !== '')
  const branch = /^## (?:No commits yet on )?([^.\s]+)/.exec(head)?.[1] ?? 'detached'

  return { branch: branch === 'HEAD' ? 'detached' : branch, isDirty: changes.length > 0 }
}

async function tick($: EngineInterface) {
  const time = await $.clock.now()
  await update($, now, () => time)
}

async function refreshGit($: EngineInterface) {
  const repo = await lookUpGit($)
  await update($, git, () => repo)
}

async function refreshPlace($: EngineInterface) {
  const [dir, home, repo] = await Promise.all([$.session.cwd(), $.env.get('HOME'), lookUpGit($)])
  await update($, cwd, () => folderName(dir, home))
  await update($, git, () => repo)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await refreshPlace($)
    const figures = usageOf(await $.session.usage())
    await update($, usage, () => figures)
    await tick($)
    $.clock.every(60_000, () => void tick($))

    // Until the first turn names the model, the /config row stands in for it.
    const row = (await $.config.list()).find(r => r.key === 'model')
    if (typeof row?.value === 'string' && row.value !== '' && (await read($, model)) === null) {
      const configured = row.value
      await update($, model, () => configured)
    }

    return result
  })

  on('session.measure', async ($, e, next) => {
    await update($, usage, () => usageOf(e))

    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined) {
      await update($, model, () => e.model)
      await update($, effort, () => (e.effort === undefined ? null : String(e.effort)))
    }

    return yield* next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    await refreshGit($)

    return result
  })

  on('classic.CwdChanged', async ($, e, next) => {
    const result = await next(e)
    await refreshPlace($)

    return result
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const [dir, repo, id, level, figures, time] = await Promise.all([
      read($, cwd),
      read($, git),
      read($, model),
      read($, effort),
      read($, usage),
      read($, now),
    ])

    const gauge = (label: string, percent: number, resetsAt?: string) => {
      const { full, empty } = meter(percent)
      const left = countdown(resetsAt, time)

      return (
        <Text>
          <Text dimColor>{`${label} `}</Text>
          <Text color={levelColor(percent)}>{full}</Text>
          <Text dimColor>{empty}</Text>
          <Text bold color={levelColor(percent)}>{` ${Math.round(percent)}%`}</Text>
          {left && <Text dimColor>{` ↻${left}`}</Text>}
        </Text>
      )
    }

    return (
      <Box flexDirection="row" flexWrap="wrap" columnGap={3} width={e.props.bodyColumns}>
        {dir && (
          <Text>
            <Text bold color="suggestion">{dir}</Text>
            {repo && <Text color={repo.isDirty ? 'warning' : 'success'}>{`  ${repo.branch}${repo.isDirty ? '*' : ''}`}</Text>}
          </Text>
        )}
        {id && (
          <Text>
            <Text color="claude">{`◆ ${modelName(id)}`}</Text>
            {level && <Text italic dimColor>{` ${level}`}</Text>}
          </Text>
        )}
        {figures.contextPercent !== undefined && gauge('ctx', figures.contextPercent)}
        {figures.limits.map(limit =>
          gauge(LIMIT_LABELS[limit.kind] ?? limit.kind, limit.percentUsed, limit.resetsAt),
        )}
      </Box>
    )
  })
}
