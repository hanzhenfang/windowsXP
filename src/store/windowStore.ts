import { defineStore } from "pinia"
import { getDesktopApp } from "@/apps/manifest"
import { useDesktopStore } from "@/store/desktopStore"

export type WindowState = "normal" | "minimized" | "maximized"

export interface AppWindow {
  id: string
  appId: string
  initialFolderId?: string
  title: string
  icon: string
  state: WindowState
  restoreState: "normal" | "maximized"
  zIndex: number
  x: number
  y: number
  width: number
  height: number
}

const TASKBAR_HEIGHT = 40
const MIN_WIDTH = 320
const MIN_HEIGHT = 220
const WINDOW_LAYOUTS_KEY = "windows-xp-mock:window-layouts"

interface WindowLayout { appId: string; x: number; y: number; width: number; height: number }

function loadWindowLayouts(): WindowLayout[] {
  try {
    const value = JSON.parse(localStorage.getItem(WINDOW_LAYOUTS_KEY) ?? "null") as { version?: number; layouts?: unknown }
    if (value?.version !== 1 || !Array.isArray(value.layouts)) return []
    return value.layouts.flatMap((item) => {
      if (!item || typeof item !== "object") return []
      const layout = item as Partial<WindowLayout>
      if (typeof layout.appId !== "string" || !layout.appId || ![layout.x, layout.y, layout.width, layout.height].every((part) => typeof part === "number" && Number.isFinite(part))) return []
      return [{ appId: layout.appId, x: Math.max(0, Math.min(10000, Math.round(layout.x!))), y: Math.max(0, Math.min(10000, Math.round(layout.y!))), width: Math.max(MIN_WIDTH, Math.min(10000, Math.round(layout.width!))), height: Math.max(MIN_HEIGHT, Math.min(10000, Math.round(layout.height!))) }]
    }).slice(-50)
  } catch { return [] }
}

function persistWindowLayouts(layouts: WindowLayout[]) {
  try { localStorage.setItem(WINDOW_LAYOUTS_KEY, JSON.stringify({ version: 1, layouts: layouts.slice(-50) })) }
  catch { /* Keep this session usable when browser storage is unavailable. */ }
}

export const useWindowStore = defineStore("windows", {
  state: () => ({ windows: [] as AppWindow[], activeWindowId: null as string | null, nextZIndex: 10, nextWindowId: 0, layouts: loadWindowLayouts() }),
  getters: {
    visibleWindows: (state) => state.windows.filter((window) => window.state !== "minimized"),
    taskbarWindows: (state) => state.windows,
    activeWindow: (state) => state.windows.find((window) => window.id === state.activeWindowId),
  },
  actions: {
    open(appId: string, initialFolderId?: string) {
      const app = getDesktopApp(appId)
      if (!app) return
      useDesktopStore().recordRecentApp(appId)
      const targetFolderId = initialFolderId ?? app.defaultFolderId
      const existing = this.windows.find((window) => window.appId === appId)
      if (existing) {
        if (targetFolderId) existing.initialFolderId = targetFolderId
        this.focus(existing.id)
        return existing.id
      }
      const viewportWidth = globalThis.innerWidth
      const viewportHeight = globalThis.innerHeight
      const offset = (this.nextWindowId % 5) * 28
      const id = `${appId}-${Date.now()}-${++this.nextWindowId}`
      const windowWidth = Math.min(680, Math.max(MIN_WIDTH, viewportWidth - 80))
      const windowHeight = Math.min(460, Math.max(MIN_HEIGHT, viewportHeight - TASKBAR_HEIGHT - 110))
      const savedLayout = this.layouts.find((layout) => layout.appId === appId)
      const width = savedLayout ? Math.min(Math.max(MIN_WIDTH, savedLayout.width), viewportWidth) : windowWidth
      const height = savedLayout ? Math.min(Math.max(MIN_HEIGHT, savedLayout.height), viewportHeight - TASKBAR_HEIGHT) : windowHeight
      const window: AppWindow = {
        id,
        appId,
        initialFolderId: targetFolderId,
        title: app.title,
        icon: app.icon,
        state: "normal",
        restoreState: "normal",
        zIndex: ++this.nextZIndex,
        x: Math.max(0, Math.min(savedLayout?.x ?? 80 + offset, viewportWidth - width)),
        y: Math.max(0, Math.min(savedLayout?.y ?? 44 + offset, viewportHeight - TASKBAR_HEIGHT - height)),
        width,
        height,
      }
      this.windows.push(window)
      this.activeWindowId = id
      return id
    },
    focus(id: string) {
      const target = this.windows.find((window) => window.id === id)
      if (!target) return
      target.state = target.state === "minimized" ? target.restoreState : target.state
      target.zIndex = ++this.nextZIndex
      this.activeWindowId = id
    },
    setWindowTitle(id: string, title: string) {
      const target = this.windows.find((window) => window.id === id)
      if (target) target.title = title
    },
    minimize(id: string) {
      const target = this.windows.find((window) => window.id === id)
      if (!target) return
      if (target.state !== "minimized") target.restoreState = target.state
      target.state = "minimized"
      if (this.activeWindowId === id) this.activateTopWindow()
    },
    toggleMaximize(id: string) {
      const target = this.windows.find((window) => window.id === id)
      if (!target) return
      target.state = target.state === "maximized" ? "normal" : "maximized"
      target.restoreState = target.state
      this.focus(id)
    },
    close(id: string) {
      this.windows = this.windows.filter((window) => window.id !== id)
      if (this.activeWindowId === id) this.activateTopWindow()
    },
    move(id: string, x: number, y: number) {
      const target = this.windows.find((window) => window.id === id)
      if (!target || target.state === "maximized") return
      const width = globalThis.innerWidth
      const height = globalThis.innerHeight - TASKBAR_HEIGHT
      target.x = Math.round(Math.max(0, Math.min(x, width - 140)))
      target.y = Math.round(Math.max(0, Math.min(y, height - 32)))
      this.saveLayout(target)
    },
    resize(id: string, width: number, height: number) {
      const target = this.windows.find((window) => window.id === id)
      if (!target || target.state !== "normal") return
      const availableWidth = Math.max(160, globalThis.innerWidth - target.x)
      const availableHeight = Math.max(120, globalThis.innerHeight - TASKBAR_HEIGHT - target.y)
      target.width = Math.round(Math.max(Math.min(MIN_WIDTH, availableWidth), Math.min(width, availableWidth)))
      target.height = Math.round(Math.max(Math.min(MIN_HEIGHT, availableHeight), Math.min(height, availableHeight)))
      this.saveLayout(target)
    },
    saveLayout(target: AppWindow) {
      const layout: WindowLayout = { appId: target.appId, x: target.x, y: target.y, width: target.width, height: target.height }
      const index = this.layouts.findIndex((item) => item.appId === target.appId)
      if (index < 0) this.layouts.push(layout)
      else this.layouts[index] = layout
      this.layouts = this.layouts.slice(-50)
      persistWindowLayouts(this.layouts)
    },
    resizeForViewport() {
      const width = globalThis.innerWidth
      const height = globalThis.innerHeight - TASKBAR_HEIGHT
      this.windows.forEach((window) => {
        window.x = Math.max(0, Math.min(window.x, width - 140))
        window.y = Math.max(0, Math.min(window.y, height - 32))
        if (window.state === "normal") {
          window.width = Math.max(Math.min(MIN_WIDTH, width - window.x), Math.min(window.width, width - window.x))
          window.height = Math.max(Math.min(MIN_HEIGHT, height - window.y), Math.min(window.height, height - window.y))
        }
      })
    },
    activateTopWindow() {
      const top = this.windows.filter((window) => window.state !== "minimized").sort((a, b) => b.zIndex - a.zIndex)[0]
      this.activeWindowId = top?.id ?? null
      if (top) top.zIndex = ++this.nextZIndex
    },
  },
})
