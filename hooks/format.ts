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

// How the band is drawn: meter cells, columns between parts, and the folder
// whole or as its last part.
export type Layout = { cells: number; gap: number; isFolderShort: boolean }

// Tried in order: the first that fits on one row is drawn; the last wraps.
export const LAYOUTS: readonly Layout[] = [
  { cells: 8, gap: 3, isFolderShort: false },
  { cells: 6, gap: 2, isFolderShort: false },
  { cells: 4, gap: 2, isFolderShort: false },
  { cells: 4, gap: 2, isFolderShort: true },
  { cells: 3, gap: 2, isFolderShort: true },
]

export type Gauge = { label: string; value: string; left?: string }

// The band's texts, all but the meters.
export type Band = { folder?: string; branch?: string; model?: string; gauges: Gauge[] }

export const shortFolder = (folder: string) => folder.split('/').filter(Boolean).at(-1) ?? folder

const placeText = (band: Band, layout: Layout) =>
  band.folder === undefined
    ? undefined
    : `${layout.isFolderShort ? shortFolder(band.folder) : band.folder}${band.branch ? `  ${band.branch}` : ''}`

export const gaugeText = (gauge: Gauge, cells: number) =>
  `${gauge.label} ${'▰'.repeat(cells)} ${gauge.value}${gauge.left ? ` ↻${gauge.left}` : ''}`

export const widthOf = (band: Band, layout: Layout) => {
  const parts = [placeText(band, layout), band.model, ...band.gauges.map(g => gaugeText(g, layout.cells))]
    .filter((part): part is string => part !== undefined)

  return parts.reduce((sum, part) => sum + [...part].length, 0) + layout.gap * (parts.length - 1)
}

export const fit = (band: Band, columns: number): Layout =>
  LAYOUTS.find(layout => widthOf(band, layout) <= columns) ?? (LAYOUTS.at(-1) as Layout)
