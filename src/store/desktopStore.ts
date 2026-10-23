import { defineStore } from "pinia"

const STORAGE_KEY = "windows-xp-mock:desktop-shortcuts"
const protectedShortcuts = new Set(["computer", "recycle", "network"])

interface ShortcutState {
  version: 1
  titles: Record<string, string>
  hidden: string[]
}

function loadShortcuts(): ShortcutState {
  const fallback: ShortcutState = { version: 1, titles: {}, hidden: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const value = JSON.parse(raw) as Partial<ShortcutState>
    if (value.version !== 1 || !value.titles || typeof value.titles !== "object" || !Array.isArray(value.hidden)) return fallback
    return { version: 1, titles: value.titles, hidden: value.hidden.filter((id): id is string => typeof id === "string") }
  } catch {
    return fallback
  }
}

export const useDesktopStore = defineStore("desktop", {
  state: () => ({ shortcuts: loadShortcuts(), selectedId: null as string | null, selectedIds: [] as string[], iconSize: "large" as "large" | "small", sortAlphabetically: false }),
  actions: {
    persist() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.shortcuts)) } catch { /* Keep the current desktop usable if storage is blocked. */ }
    },
    renameShortcut(id: string, title: string) {
      if (protectedShortcuts.has(id)) throw new Error("此系统图标不能重命名。")
      const safeTitle = title.trim()
      if (!safeTitle || safeTitle.length > 64) throw new Error("名称需为 1 至 64 个字符。")
      this.shortcuts.titles[id] = safeTitle
      this.persist()
    },
    removeShortcut(id: string) {
      if (protectedShortcuts.has(id)) throw new Error("此系统图标不能删除。")
      if (!this.shortcuts.hidden.includes(id)) this.shortcuts.hidden.push(id)
      this.persist()
    },
    resetShortcut(id: string) {
      delete this.shortcuts.titles[id]
      this.shortcuts.hidden = this.shortcuts.hidden.filter((hiddenId) => hiddenId !== id)
      this.persist()
    },
  },
})
