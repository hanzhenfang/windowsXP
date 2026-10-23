import { defineStore } from "pinia"
import { getDesktopApp } from "@/apps/manifest"

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

export const useWindowStore = defineStore("windows", {
  state: () => ({ windows: [] as AppWindow[], activeWindowId: null as string | null, nextZIndex: 10, nextWindowId: 0 }),
  getters: {
    visibleWindows: (state) => state.windows.filter((window) => window.state !== "minimized"),
    taskbarWindows: (state) => state.windows,
    activeWindow: (state) => state.windows.find((window) => window.id === state.activeWindowId),
  },
  actions: {
    open(appId: string, initialFolderId?: string) {
      const app = getDesktopApp(appId)
      if (!app) return
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
      const window: AppWindow = {
        id,
        appId,
        initialFolderId: targetFolderId,
        title: app.title,
        icon: app.icon,
        state: "normal",
        restoreState: "normal",
        zIndex: ++this.nextZIndex,
        x: Math.max(0, Math.min(80 + offset, viewportWidth - windowWidth)),
        y: Math.max(0, Math.min(44 + offset, viewportHeight - TASKBAR_HEIGHT - windowHeight)),
        width: windowWidth,
        height: windowHeight,
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
    },
    resize(id: string, width: number, height: number) {
      const target = this.windows.find((window) => window.id === id)
      if (!target || target.state !== "normal") return
      const availableWidth = Math.max(160, globalThis.innerWidth - target.x)
      const availableHeight = Math.max(120, globalThis.innerHeight - TASKBAR_HEIGHT - target.y)
      target.width = Math.round(Math.max(Math.min(MIN_WIDTH, availableWidth), Math.min(width, availableWidth)))
      target.height = Math.round(Math.max(Math.min(MIN_HEIGHT, availableHeight), Math.min(height, availableHeight)))
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
