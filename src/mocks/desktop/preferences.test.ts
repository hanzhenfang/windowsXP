import { beforeEach, describe, expect, it } from "vitest"
import { createPinia, setActivePinia } from "pinia"
import { useDesktopStore } from "@/store/desktopStore"

describe("desktop preference migration", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("migratesV1ShortcutState", () => {
    localStorage.setItem("windows-xp-mock:desktop-shortcuts", JSON.stringify({ version: 1, titles: { browser: "浏览器" }, hidden: ["blog"] }))

    const desktop = useDesktopStore()

    expect(desktop.shortcuts).toMatchObject({ version: 2, titles: { browser: "浏览器" }, hidden: ["blog"], custom: [], iconPositions: {}, sortMode: "manual", recentApps: [] })
  })

  it("fallsBackForMalformedDesktopState", () => {
    localStorage.setItem("windows-xp-mock:desktop-shortcuts", "{")

    const desktop = useDesktopStore()

    expect(desktop.shortcuts).toMatchObject({ version: 2, titles: {}, hidden: [], custom: [], iconPositions: {}, sortMode: "manual", recentApps: [] })
  })

  it("keepsOnlyFiveRecentApps", () => {
    const desktop = useDesktopStore()
    desktop.recordRecentApp("computer")
    desktop.recordRecentApp("browser")
    desktop.recordRecentApp("blog")
    desktop.recordRecentApp("network")
    desktop.recordRecentApp("recycle")
    desktop.recordRecentApp("control-panel")

    expect(desktop.shortcuts.recentApps).toEqual(["control-panel", "recycle", "network", "blog", "browser"])
  })
})
