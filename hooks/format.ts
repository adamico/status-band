// `claude-opus-5-5[1m]` → `Opus 5.5`; anything else as given.
export const modelName = (id: string) => {
  const match = /^(?:claude-)?([a-z]+)-(\d+)(?:-(\d{1,2}))?(?!\d)/.exec(id)

  if (!match) {
    return id
  }

  const [, family = '', major, minor] = match

  return `${family[0]?.toUpperCase()}${family.slice(1)} ${major}${minor ? `.${minor}` : ''}`
}

// `/home/me/a/b/c` → `~/a/b/c`, cut to its last two parts past three.
export const folderName = (cwd: string, home: string | undefined) => {
  const path = home && (cwd === home || cwd.startsWith(`${home}/`)) ? `~${cwd.slice(home.length)}` : cwd
  const parts = path.split('/')

  return parts.filter(Boolean).length > 3 ? `…/${parts.slice(-2).join('/')}` : path
}

export const levelColor = (percent: number) =>
  percent >= 80 ? 'error' : percent >= 50 ? 'warning' : 'success'

export const meter = (percent: number, cells = 8) => {
  const full = Math.min(cells, Math.max(0, Math.round((percent / 100) * cells)))

  return { full: '▰'.repeat(full), empty: '▱'.repeat(cells - full) }
}

// Time until `resetsAt`: `42m`, `2h14m`, `3d4h`; undefined once past or unknown.
export const countdown = (resetsAt: string | undefined, now: number) => {
  const ms = resetsAt ? Date.parse(resetsAt) - now : Number.NaN

  if (!(ms > 0)) {
    return undefined
  }

  const minutes = Math.ceil(ms / 60_000)
  const [d, h, m] = [Math.floor(minutes / 1440), Math.floor((minutes % 1440) / 60), minutes % 60]

  return d > 0 ? `${d}d${h}h` : h > 0 ? `${h}h${String(m).padStart(2, '0')}m` : `${m}m`
}

export const LIMIT_LABELS: Record<string, string> = { five_hour: '5h', seven_day: '7d', spend_limit: '$' }
