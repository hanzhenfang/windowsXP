import { defineStore } from "pinia"
import { desktopApps, getDesktopApp } from "@/apps/manifest"

const STORAGE_KEY = "windowsxp.desktop.v2"

interface PersistedDesktopState {
  version: number
  windows: AppWindow[]
  activeWindowId: string | null
  nextZIndex: number
  iconLayout: "list" | "grid"
  iconSort: "default" | "name" | "type"
  clipboardAppId: string | null
  shortcutCopies: Array<{ id: string; appId: string }>
  customTitles: Record<string, string>
  recycleItems: string[]
  restoredItems: string[]
  wallpaper: "bliss" | "blue"
  pinnedApps: string[]
  recentApps: string[]
}

function readPersistedState(): Partial<PersistedDesktopState> {
  if (typeof localStorage === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<PersistedDesktopState>
    if (parsed.version !== 1) return {}
    const windows = Array.isArray(parsed.windows) ? parsed.windows.filter((item) =>
      item && typeof item.appId === "string" && (getDesktopApp(item.appId) || item.appId.startsWith("properties:")) &&
      typeof item.id === "string" && typeof item.title === "string" && Number.isFinite(item.x) && Number.isFinite(item.y) &&
      Number.isFinite(item.width) && Number.isFinite(item.height),
    ).map((item) => ({ ...item, browserUrl: undefined })) : []
    const shortcutCopies = Array.isArray(parsed.shortcutCopies) ? parsed.shortcutCopies.filter((item) => item && typeof item.id === "string" && !!getDesktopApp(item.appId)) : []
    const customTitles = parsed.customTitles && typeof parsed.customTitles === "object" ? Object.fromEntries(Object.entries(parsed.customTitles).filter(([, value]) => typeof value === "string" && value.length <= 40)) : {}
    return {
      windows,
      activeWindowId: typeof parsed.activeWindowId === "string" && windows.some((item) => item.id === parsed.activeWindowId) ? parsed.activeWindowId : null,
      nextZIndex: Number.isFinite(parsed.nextZIndex) ? Math.max(10, parsed.nextZIndex as number) : 10,
      iconLayout: parsed.iconLayout === "grid" ? "grid" : "list",
      iconSort: parsed.iconSort === "type" || parsed.iconSort === "name" ? parsed.iconSort : "default",
      clipboardAppId: getDesktopApp(parsed.clipboardAppId ?? "") ? parsed.clipboardAppId : null,
      shortcutCopies,
      customTitles,
      recycleItems: Array.isArray(parsed.recycleItems) ? parsed.recycleItems.filter((item) => typeof item === "string") : ["示例文档.txt", "旧版图片.jpg"],
      restoredItems: Array.isArray(parsed.restoredItems) ? parsed.restoredItems.filter((item) => typeof item === "string") : [],
      wallpaper: parsed.wallpaper === "blue" ? "blue" : "bliss",
      pinnedApps: Array.isArray(parsed.pinnedApps) ? parsed.pinnedApps.filter((id) => !!getDesktopApp(id)) : ["computer", "browser", "blog"],
      recentApps: Array.isArray(parsed.recentApps) ? parsed.recentApps.filter((id) => !!getDesktopApp(id)).slice(0, 8) : [],
    }
  } catch {
    return {}
  }
}

export interface AppWindow {
  id: string
  appId: string
  title: string
  icon: string
  minimized: boolean
  maximized: boolean
  zIndex: number
  x: number
  y: number
  width: number
  height: number
  targetId?: string
  browserUrl?: string
  computerLocation?: "drives" | "documents" | "control-panel" | "c-drive" | "d-drive"
  snap?: "left" | "right" | null
}

export const useWindowStore = defineStore("windows", {
  state: () => {
    const saved = readPersistedState()
    return {
      windows: saved.windows ?? [] as AppWindow[], activeWindowId: saved.activeWindowId ?? null, nextZIndex: saved.nextZIndex ?? 10,
      iconLayout: saved.iconLayout ?? "list" as "list" | "grid", iconSort: saved.iconSort ?? "default" as "default" | "name" | "type",
      clipboardAppId: saved.clipboardAppId ?? null, shortcutCopies: saved.shortcutCopies ?? [] as Array<{ id: string; appId: string }>,
      customTitles: saved.customTitles ?? {} as Record<string, string>, desktopRevision: 0,
      recycleItems: saved.recycleItems ?? ["示例文档.txt", "旧版图片.jpg"] as string[], restoredItems: saved.restoredItems ?? [] as string[], wallpaper: saved.wallpaper ?? "bliss" as "bliss" | "blue",
      pinnedApps: saved.pinnedApps ?? ["computer", "browser", "blog"] as string[], recentApps: saved.recentApps ?? [] as string[],
    }
  },
  getters: {
    visibleWindows: (state) => state.windows.filter((window) => !window.minimized),
    activeWindow: (state) => state.windows.find((window) => window.id === state.activeWindowId),
    desktopIcons: (state) => [
      ...desktopApps.map((app) => ({ id: app.id, appId: app.id, title: state.customTitles[app.id] ?? app.title, icon: app.icon })),
      ...state.shortcutCopies.map((copy) => {
        const app = getDesktopApp(copy.appId)!
        return { id: copy.id, appId: copy.appId, title: state.customTitles[copy.id] ?? `${state.customTitles[copy.appId] ?? app.title} - 快捷方式`, icon: app.icon }
      }),
    ],
  },
  actions: {
    persist() {
      if (typeof localStorage === "undefined") return
      try {
        const savedWindows = this.windows.map((item) => {
          const { browserUrl: _browserUrl, ...safeWindow } = item
          return safeWindow
        })
        const saved: PersistedDesktopState = {
          version: 1, windows: savedWindows, activeWindowId: this.activeWindowId, nextZIndex: this.nextZIndex,
          iconLayout: this.iconLayout, iconSort: this.iconSort, clipboardAppId: this.clipboardAppId,
          shortcutCopies: this.shortcutCopies, customTitles: this.customTitles, recycleItems: this.recycleItems, restoredItems: this.restoredItems, wallpaper: this.wallpaper, pinnedApps: this.pinnedApps, recentApps: this.recentApps,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
      } catch { /* storage can be unavailable or full; the desktop continues in memory */ }
    },
    clearSession() { this.windows = []; this.activeWindowId = null; this.nextZIndex = 10 },
    togglePinnedApp(appId: string) {
      if (!getDesktopApp(appId)) return
      this.pinnedApps = this.pinnedApps.includes(appId) ? this.pinnedApps.filter((id) => id !== appId) : [...this.pinnedApps, appId]
    },
    openProperties(appId: string, targetId = appId) {
      const app = getDesktopApp(appId)
      if (!app) return
      const existing = this.windows.find((window) => window.appId === `properties:${appId}` && window.targetId === targetId)
      if (existing) {
        existing.minimized = false
        this.focusWindow(existing.id)
        return
      }
      const id = `properties:${appId}-${Date.now()}`
      this.windows.push({ id, appId: `properties:${appId}`, targetId, title: `${this.customTitles[targetId] ?? this.customTitles[appId] ?? app.title} 属性`, icon: app.icon, minimized: false, maximized: false, zIndex: ++this.nextZIndex, x: Math.max(20, Math.round((window.innerWidth - 520) / 2)), y: Math.max(20, Math.round((window.innerHeight - 360) / 2)), width: 520, height: 360 })
      this.activeWindowId = id
    },
    setCustomTitle(targetId: string, title: string) {
      const normalized = title.trim()
      if (!normalized) return
      this.customTitles[targetId] = normalized
      this.windows.forEach((window) => {
        if (window.targetId === targetId && window.appId.startsWith("properties:")) window.title = `${normalized} 属性`
        else if (window.appId === targetId) window.title = normalized
      })
    },
    setBrowserUrl(id: string, url: string) {
      const target = this.windows.find((window) => window.id === id)
      if (target) target.browserUrl = url
    },
    setComputerLocation(id: string, location: NonNullable<AppWindow["computerLocation"]>) {
      const target = this.windows.find((window) => window.id === id)
      if (target) target.computerLocation = location
    },
    cycleWindow() {
      const visible = [...this.visibleWindows].sort((a, b) => b.zIndex - a.zIndex)
      if (visible.length < 2) return
      const currentIndex = visible.findIndex((window) => window.id === this.activeWindowId)
      this.focusWindow(visible[(currentIndex + 1) % visible.length].id)
    },
    restoreRecycleItem(name: string) {
      if (!this.recycleItems.includes(name)) return
      this.recycleItems = this.recycleItems.filter((item) => item !== name)
      this.restoredItems.push(name)
    },
    emptyRecycle() { this.recycleItems = [] },
    setWallpaper(wallpaper: "bliss" | "blue") { this.wallpaper = wallpaper },
    toggleIconLayout() { this.iconLayout = this.iconLayout === "list" ? "grid" : "list" },
    toggleIconSort() { this.iconSort = this.iconSort === "default" ? "name" : this.iconSort === "name" ? "type" : "default" },
    refreshDesktop() { this.desktopRevision += 1 },
    copyShortcut(appId: string) { this.clipboardAppId = appId },
    pasteShortcut() { if (this.clipboardAppId) this.createShortcut(this.clipboardAppId) },
    createShortcut(appId: string) {
      if (!getDesktopApp(appId)) return
      this.shortcutCopies.push({ id: `${appId}-shortcut-${Date.now()}`, appId })
    },
    removeShortcut(id: string) {
      this.shortcutCopies = this.shortcutCopies.filter((shortcut) => shortcut.id !== id)
      delete this.customTitles[id]
    },
    openApp(appId: string) {
      const app = getDesktopApp(appId)
      if (!app) return
      this.recentApps = [appId, ...this.recentApps.filter((id) => id !== appId)].slice(0, 8)
      const existing = this.windows.find((window) => window.appId === appId)
      if (existing) {
        existing.minimized = false
        this.focusWindow(existing.id)
        return
      }
      const offset = (this.windows.length % 5) * 28
      const id = `${appId}-${Date.now()}`
      this.windows.push({
        id, appId, title: this.customTitles[appId] ?? app.title, icon: app.icon, minimized: false, maximized: false,
        zIndex: ++this.nextZIndex, x: 80 + offset, y: 44 + offset,
        width: Math.min(680, Math.max(320, window.innerWidth - 80)),
        height: Math.min(460, Math.max(280, window.innerHeight - 150)),
        browserUrl: app.kind === "browser" ? "https://www.juejin.cn/" : undefined,
        computerLocation: app.kind === "computer" ? "drives" : undefined,
      })
      this.activeWindowId = id
    },
    focusWindow(id: string) {
      const target = this.windows.find((window) => window.id === id)
      if (!target) return
      target.minimized = false
      target.zIndex = ++this.nextZIndex
      this.activeWindowId = id
    },
    minimizeWindow(id: string) {
      const target = this.windows.find((window) => window.id === id)
      if (!target) return
      target.minimized = true
      if (this.activeWindowId === id) {
        this.activeWindowId = [...this.windows].reverse().find((window) => !window.minimized)?.id ?? null
      }
    },
    toggleMaximize(id: string) {
      const target = this.windows.find((window) => window.id === id)
      if (!target) return
      target.maximized = !target.maximized
      target.snap = null
      this.focusWindow(id)
    },
    closeWindow(id: string) {
      this.windows = this.windows.filter((window) => window.id !== id)
      if (this.activeWindowId === id) this.activeWindowId = [...this.windows].reverse().find((window) => !window.minimized)?.id ?? null
    },
    moveWindow(id: string, x: number, y: number) {
      const target = this.windows.find((window) => window.id === id)
      if (target && !target.maximized) { target.snap = null; target.x = Math.max(0, Math.min(x, Math.max(0, globalThis.innerWidth - target.width))); target.y = Math.max(0, Math.min(y, Math.max(0, globalThis.innerHeight - target.height - 40))) }
    },
    snapWindow(id: string, side: "left" | "right") {
      const target = this.windows.find((window) => window.id === id)
      if (!target || target.maximized) return
      const workWidth = globalThis.innerWidth
      const workHeight = globalThis.innerHeight - 40
      target.snap = side
      target.x = side === "left" ? 0 : Math.floor(workWidth / 2)
      target.y = 0
      target.width = side === "left" ? Math.floor(workWidth / 2) : Math.ceil(workWidth / 2)
      target.height = workHeight
      this.focusWindow(id)
    },
    resizeWindow(id: string, width: number, height: number) {
      const target = this.windows.find((window) => window.id === id)
      if (!target || target.maximized) return
      target.snap = null
      target.width = Math.max(300, Math.min(width, globalThis.innerWidth - target.x))
      target.height = Math.max(220, Math.min(height, globalThis.innerHeight - target.y - 40))
    },
    resizeForViewport() {
      this.windows.forEach((window) => {
        window.width = Math.max(300, Math.min(window.width, Math.max(300, globalThis.innerWidth)))
        window.height = Math.max(220, Math.min(window.height, Math.max(220, globalThis.innerHeight - 40)))
        window.x = Math.max(0, Math.min(window.x, Math.max(0, globalThis.innerWidth - window.width)))
        window.y = Math.max(0, Math.min(window.y, Math.max(0, globalThis.innerHeight - window.height - 40)))
      })
    },
  },
})

