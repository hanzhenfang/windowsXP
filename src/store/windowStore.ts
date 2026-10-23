import { defineStore } from "pinia"
import { getDesktopApp } from "@/apps/manifest"

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
}

export const useWindowStore = defineStore("windows", {
  state: () => ({ windows: [] as AppWindow[], activeWindowId: null as string | null, nextZIndex: 10 }),
  getters: {
    visibleWindows: (state) => state.windows.filter((window) => !window.minimized),
    activeWindow: (state) => state.windows.find((window) => window.id === state.activeWindowId),
  },
  actions: {
    openApp(appId: string) {
      const app = getDesktopApp(appId)
      if (!app) return
      if (app.externalUrl) {
        window.open(app.externalUrl, "_blank", "noopener,noreferrer")
        return
      }
      const existing = this.windows.find((window) => window.appId === appId)
      if (existing) {
        existing.minimized = false
        this.focusWindow(existing.id)
        return
      }
      const offset = (this.windows.length % 5) * 28
      const id = `${appId}-${Date.now()}`
      this.windows.push({
        id, appId, title: app.title, icon: app.icon, minimized: false, maximized: false,
        zIndex: ++this.nextZIndex, x: 80 + offset, y: 44 + offset,
        width: Math.min(680, Math.max(320, window.innerWidth - 80)),
        height: Math.min(460, Math.max(280, window.innerHeight - 150)),
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
      this.focusWindow(id)
    },
    closeWindow(id: string) {
      this.windows = this.windows.filter((window) => window.id !== id)
      if (this.activeWindowId === id) this.activeWindowId = [...this.windows].reverse().find((window) => !window.minimized)?.id ?? null
    },
    moveWindow(id: string, x: number, y: number) {
      const target = this.windows.find((window) => window.id === id)
      if (target && !target.maximized) { target.x = x; target.y = y }
    },
    resizeForViewport() {
      this.windows.forEach((window) => {
        window.x = Math.max(0, Math.min(window.x, globalThis.innerWidth - 160))
      })
    },
  },
})

