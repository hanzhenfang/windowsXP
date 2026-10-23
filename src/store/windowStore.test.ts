import { beforeEach, describe, expect, it } from "vitest"
import { createPinia, setActivePinia } from "pinia"
import { useWindowStore } from "@/store/windowStore"
import { useDesktopStore } from "@/store/desktopStore"

describe("per-application window layouts", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it("restoresWindowGeometryOnManualOpen", () => {
    localStorage.setItem("windows-xp-mock:window-layouts", JSON.stringify({ version: 1, layouts: [{ appId: "browser", x: 222, y: 88, width: 720, height: 500 }] }))

    const windows = useWindowStore()
    const windowId = windows.open("browser")!

    expect(windows.windows.find((item) => item.id === windowId)).toMatchObject({ x: 222, y: 88, width: 720, height: 500 })
    expect(windows.windows).toHaveLength(1)
  })

  it("persistsGeometryWithoutRestoringOpenWindows", () => {
    const firstSession = useWindowStore()
    const windowId = firstSession.open("browser")!
    firstSession.move(windowId, 200, 100)
    firstSession.resize(windowId, 700, 480)

    setActivePinia(createPinia())
    const nextSession = useWindowStore()
    expect(nextSession.windows).toHaveLength(0)
    const reopenedId = nextSession.open("browser")!

    expect(nextSession.windows.find((item) => item.id === reopenedId)).toMatchObject({ x: 200, y: 100, width: 700, height: 480 })
  })

  it("recordsRecentLaunchOnceForAllWindowLaunchPaths", () => {
    const windows = useWindowStore()
    windows.open("browser")
    windows.open("blog")
    windows.open("browser")

    expect(useDesktopStore().shortcuts.recentApps.slice(0, 2)).toEqual(["browser", "blog"])
  })
})
