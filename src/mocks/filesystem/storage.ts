import { createSeedFilesystem } from "./seed"
import type { FilesystemSnapshot, MockEntry } from "./types"

export const FILESYSTEM_STORAGE_KEY = "windows-xp-mock:filesystem"

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

let memoryValue: string | null = null
const memoryStorage: StorageLike = {
  getItem: () => memoryValue,
  setItem: (_key, value) => { memoryValue = value },
}

function getStorage(): StorageLike {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage
  } catch {
    // Storage can be unavailable in private browsing or sandboxed documents.
  }
  return memoryStorage
}

function isEntry(value: unknown): value is MockEntry {
  if (!value || typeof value !== "object") return false
  const entry = value as Partial<MockEntry>
  return typeof entry.id === "string" && typeof entry.name === "string" &&
    (entry.parentId === null || typeof entry.parentId === "string") &&
    (entry.kind === "file" || entry.kind === "folder") && typeof entry.type === "string" &&
    typeof entry.size === "number" && Number.isFinite(entry.size) &&
    typeof entry.modifiedAt === "number" && Number.isFinite(entry.modifiedAt)
}

function isValidSnapshot(value: unknown): value is FilesystemSnapshot {
  if (!value || typeof value !== "object") return false
  const snapshot = value as Partial<FilesystemSnapshot>
  if (snapshot.version !== 1 || !Array.isArray(snapshot.entries) || !Array.isArray(snapshot.recycleBin)) return false
  const all = [...snapshot.entries, ...snapshot.recycleBin]
  if (!all.every(isEntry)) return false
  const ids = new Set(all.map((entry) => entry.id))
  if (ids.size !== all.length) return false
  const activeIds = new Set(snapshot.entries.map((entry) => entry.id))
  const recycledIds = new Set(snapshot.recycleBin.map((entry) => entry.id))
  return snapshot.entries.every((entry) => entry.parentId === null || activeIds.has(entry.parentId)) &&
    snapshot.recycleBin.every((entry) => entry.parentId === null || recycledIds.has(entry.parentId) || activeIds.has(entry.parentId))
}

function persist(snapshot: FilesystemSnapshot) {
  try {
    getStorage().setItem(FILESYSTEM_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Keep the app usable if storage is full or browser policy blocks writes.
  }
}

export function loadFilesystemSnapshot(): FilesystemSnapshot {
  const storage = getStorage()
  try {
    const raw = storage.getItem(FILESYSTEM_STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isValidSnapshot(parsed)) return parsed
    }
  } catch {
    // Corrupt JSON falls back to a clean local seed.
  }
  const seed = createSeedFilesystem()
  persist(seed)
  return seed
}

export function saveFilesystemSnapshot(snapshot: FilesystemSnapshot): FilesystemSnapshot {
  persist(snapshot)
  return snapshot
}

export function copyFilesystemSnapshot(snapshot: FilesystemSnapshot): FilesystemSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as FilesystemSnapshot
}
