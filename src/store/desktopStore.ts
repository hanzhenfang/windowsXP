import { defineStore } from "pinia"
import { getDesktopApp } from "@/apps/manifest"
import { normalizeDesktopPosition, safeDesktopPreferences, type DesktopPreferences } from "@/mocks/desktop/preferences"

const STORAGE_KEY = "windows-xp-mock:desktop-shortcuts"
const protectedShortcuts = new Set(["computer", "recycle", "network"])

export const useDesktopStore = defineStore("desktop", {
  state: () => ({
    shortcuts: safeDesktopPreferences() as DesktopPreferences,
    selectedId: null as string | null,
    selectedIds: [] as string[],
    iconSize: "large" as "large" | "small",
    sortAlphabetically: false,
  }),
  actions: {
    persist() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.shortcuts)) } catch { /* Keep the current desktop usable if storage is blocked. */ }
    },
    renameShortcut(id: string, title: string) {
      const safeTitle = title.trim()
      if (!safeTitle || safeTitle.length > 64) throw new Error("名称需为 1 至 64 个字符。")
      const custom = this.shortcuts.custom.find((shortcut) => shortcut.id === id)
      if (custom) custom.title = safeTitle
      else {
        if (protectedShortcuts.has(id)) throw new Error("此系统图标不能重命名。")
        if (!getDesktopApp(id)) throw new Error("找不到此快捷方式。")
        this.shortcuts.titles[id] = safeTitle
      }
      this.persist()
    },
    removeShortcut(id: string) {
      if (protectedShortcuts.has(id)) throw new Error("此系统图标不能删除。")
      if (!getDesktopApp(id)) throw new Error("找不到此快捷方式。")
      if (!this.shortcuts.hidden.includes(id)) this.shortcuts.hidden.push(id)
      this.persist()
    },
    resetShortcut(id: string) {
      delete this.shortcuts.titles[id]
      this.shortcuts.hidden = this.shortcuts.hidden.filter((hiddenId) => hiddenId !== id)
      this.persist()
    },
    recordRecentApp(appId: string) {
      if (!getDesktopApp(appId)) return
      this.shortcuts.recentApps = [appId, ...this.shortcuts.recentApps.filter((id) => id !== appId)].slice(0, 5)
      this.persist()
    },
    setIconPosition(id: string, x: number, y: number) {
      if (!id) return
      this.shortcuts.iconPositions[id] = normalizeDesktopPosition(x, y)
      this.persist()
    },
    setSortMode(mode: DesktopPreferences["sortMode"]) {
      this.shortcuts.sortMode = mode
      this.persist()
    },
    resetIconLayout() {
      this.shortcuts.iconPositions = {}
      this.shortcuts.sortMode = "manual"
      this.persist()
    },
  },
})
