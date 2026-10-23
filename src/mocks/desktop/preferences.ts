export interface CustomShortcut {
  id: string
  appId: string
  title: string
}

export interface DesktopIconPosition {
  x: number
  y: number
}

export interface DesktopPreferences {
  version: 2
  titles: Record<string, string>
  hidden: string[]
  custom: CustomShortcut[]
  iconPositions: Record<string, DesktopIconPosition>
  sortMode: "manual" | "name" | "type"
  recentApps: string[]
}

const MAX_RECENT_APPS = 5
const MAX_POSITION = 10000

export function defaultDesktopPreferences(): DesktopPreferences {
  return { version: 2, titles: {}, hidden: [], custom: [], iconPositions: {}, sortMode: "manual", recentApps: [] }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function readTitles(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {}
  return Object.entries(value).reduce<Record<string, string>>((titles, [id, title]) => {
    if (id.length > 0 && typeof title === "string" && title.trim().length > 0 && title.length <= 64) titles[id] = title
    return titles
  }, {})
}

function readStringList(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0))] : []
}

function readCustom(value: unknown): CustomShortcut[] {
  if (!Array.isArray(value)) return []
  const ids = new Set<string>()
  return value.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.id !== "string" || !entry.id.startsWith("shortcut-") || typeof entry.appId !== "string" || !entry.appId || typeof entry.title !== "string" || !entry.title.trim() || entry.title.length > 64 || ids.has(entry.id)) return []
    ids.add(entry.id)
    return [{ id: entry.id, appId: entry.appId, title: entry.title.trim() }]
  }).slice(0, 100)
}

function readPositions(value: unknown): Record<string, DesktopIconPosition> {
  if (!isRecord(value)) return {}
  const result: Record<string, DesktopIconPosition> = {}
  for (const [id, point] of Object.entries(value)) {
    if (!id || !isRecord(point) || typeof point.x !== "number" || !Number.isFinite(point.x) || typeof point.y !== "number" || !Number.isFinite(point.y)) continue
    result[id] = { x: Math.round(Math.max(0, Math.min(MAX_POSITION, point.x))), y: Math.round(Math.max(0, Math.min(MAX_POSITION, point.y))) }
  }
  return result
}

export function loadDesktopPreferences(raw: string | null): DesktopPreferences {
  const fallback = defaultDesktopPreferences()
  if (!raw) return fallback
  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value) || (value.version !== 1 && value.version !== 2)) return fallback
    return {
      version: 2,
      titles: readTitles(value.titles),
      hidden: readStringList(value.hidden),
      custom: readCustom(value.custom),
      iconPositions: readPositions(value.iconPositions),
      sortMode: value.sortMode === "name" || value.sortMode === "type" ? value.sortMode : "manual",
      recentApps: readStringList(value.recentApps).slice(0, MAX_RECENT_APPS),
    }
  } catch {
    return fallback
  }
}

export function safeDesktopPreferences(): DesktopPreferences {
  try { return loadDesktopPreferences(localStorage.getItem("windows-xp-mock:desktop-shortcuts")) }
  catch { return defaultDesktopPreferences() }
}

export function normalizeDesktopPosition(x: number, y: number): DesktopIconPosition {
  return {
    x: Math.round(Math.max(0, Math.min(MAX_POSITION, Number.isFinite(x) ? x : 0))),
    y: Math.round(Math.max(0, Math.min(MAX_POSITION, Number.isFinite(y) ? y : 0))),
  }
}
