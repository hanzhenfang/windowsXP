import { safeDesktopPreferences, type DesktopPreferences } from "@/mocks/desktop/preferences"
import { filesystemService } from "@/mocks/filesystem/service"
import { FILESYSTEM_STORAGE_KEY, validateFilesystemSnapshot } from "@/mocks/filesystem/storage"
import type { FilesystemSnapshot } from "@/mocks/filesystem/types"
import { DESKTOP_STORAGE_KEY } from "@/store/desktopStore"
import { loadPreferencesSnapshot, PREFERENCES_STORAGE_KEY, type PreferencesSnapshot } from "@/store/preferencesStore"
import { loadSystemSnapshot, SYSTEM_STORAGE_KEY, type SystemSnapshot } from "@/store/systemStore"

export interface LocalBackup {
  version: 1
  filesystem: FilesystemSnapshot
  desktop: DesktopPreferences
  preferences: PreferencesSnapshot
  system: SystemSnapshot
}

const STORAGE_KEYS = [FILESYSTEM_STORAGE_KEY, DESKTOP_STORAGE_KEY, PREFERENCES_STORAGE_KEY, SYSTEM_STORAGE_KEY] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function validateDesktop(value: unknown): value is DesktopPreferences {
  if (!isRecord(value) || value.version !== 2 || !isRecord(value.titles) || !isStringArray(value.hidden) || !Array.isArray(value.custom) || !isRecord(value.iconPositions) || !["manual", "name", "type"].includes(String(value.sortMode)) || !isStringArray(value.recentApps)) return false
  if (!Object.entries(value.titles).every(([id, title]) => id.length > 0 && typeof title === "string" && title.trim().length > 0 && title.length <= 64)) return false
  if (!value.custom.every((entry) => isRecord(entry) && typeof entry.id === "string" && entry.id.startsWith("shortcut-") && typeof entry.appId === "string" && entry.appId.length > 0 && typeof entry.title === "string" && entry.title.trim().length > 0 && entry.title.length <= 64)) return false
  if (!Object.entries(value.iconPositions).every(([id, point]) => id.length > 0 && isRecord(point) && typeof point.x === "number" && Number.isFinite(point.x) && typeof point.y === "number" && Number.isFinite(point.y))) return false
  return true
}

function validatePreferences(value: unknown): value is PreferencesSnapshot {
  if (!isRecord(value) || value.version !== 1 || !isStringArray(value.browserFavorites) || !Array.isArray(value.browserTabs) || !value.browserTabs.length || typeof value.activeBrowserTabId !== "string" || !["deskbg", "desktop-background"].includes(String(value.wallpaperId)) || typeof value.soundEnabled !== "boolean" || typeof value.soundVolume !== "number" || !Number.isFinite(value.soundVolume) || value.soundVolume < 0 || value.soundVolume > 1 || !["large", "small"].includes(String(value.iconSize)) || !["blue", "olive", "silver"].includes(String(value.themeColor))) return false
  const ids = new Set<string>()
  for (const tab of value.browserTabs) {
    if (!isRecord(tab) || typeof tab.id !== "string" || !tab.id || ids.has(tab.id) || typeof tab.address !== "string" || !isStringArray(tab.history) || !tab.history.length || typeof tab.historyIndex !== "number" || !Number.isInteger(tab.historyIndex) || tab.historyIndex < 0 || tab.historyIndex >= tab.history.length) return false
    ids.add(tab.id)
  }
  return ids.has(value.activeBrowserTabId)
}

function validateSystem(value: unknown): value is SystemSnapshot {
  return isRecord(value) && value.version === 1 && isRecord(value.network) && typeof value.network.connected === "boolean"
}

export function createLocalBackup(): LocalBackup {
  return validateLocalBackup({
    version: 1,
    filesystem: filesystemService.load(),
    desktop: safeDesktopPreferences(),
    preferences: loadPreferencesSnapshot(),
    system: loadSystemSnapshot(),
  })
}

export function validateLocalBackup(value: unknown): LocalBackup {
  if (!isRecord(value) || value.version !== 1 || !validateFilesystemSnapshot(value.filesystem) || !validateDesktop(value.desktop) || !validatePreferences(value.preferences) || !validateSystem(value.system)) {
    throw new Error("备份文件无效或版本不受支持。")
  }
  return JSON.parse(JSON.stringify(value)) as LocalBackup
}

export function restoreLocalBackup(value: unknown): void {
  const backup = validateLocalBackup(value)
  const serialized = [backup.filesystem, backup.desktop, backup.preferences, backup.system].map((snapshot) => JSON.stringify(snapshot))
  const previous = STORAGE_KEYS.map((key) => localStorage.getItem(key))
  try {
    STORAGE_KEYS.forEach((key, index) => localStorage.setItem(key, serialized[index]))
  } catch (error) {
    STORAGE_KEYS.forEach((key, index) => {
      try {
        if (previous[index] === null) localStorage.removeItem(key)
        else localStorage.setItem(key, previous[index]!)
      } catch { /* Best effort rollback if browser storage becomes unavailable mid-restore. */ }
    })
    throw new Error(error instanceof Error ? `恢复失败：${error.message}` : "恢复失败，原有设置已回滚。")
  }
}
