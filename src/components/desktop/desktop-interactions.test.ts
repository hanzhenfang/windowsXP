import { describe, expect, it } from "vitest"
import { createPinia, setActivePinia } from "pinia"
import { mount } from "@vue/test-utils"
import IconGroup from "@/pages/DeskTop/IconGroup/index.vue"
import StartMenu from "@/components/desktop/StartMenu.vue"
import { useDesktopStore } from "@/store/desktopStore"
import { desktopApps } from "@/apps/manifest"

describe("desktop shortcut state", () => {
  it("createsAndRemovesCustomShortcut", () => {
    setActivePinia(createPinia())
    const desktop = useDesktopStore()

    const shortcut = desktop.createShortcut("browser", "IE 快捷方式")

    expect(desktop.shortcuts.custom).toContainEqual({ id: shortcut, appId: "browser", title: "IE 快捷方式" })
    desktop.removeCustomShortcut(shortcut)
    expect(desktop.shortcuts.custom).toHaveLength(0)
  })

  it("persistsIconPosition", () => {
    setActivePinia(createPinia())
    const desktop = useDesktopStore()

    desktop.setIconPosition("browser", 240, 120)

    expect(JSON.parse(localStorage.getItem("windows-xp-mock:desktop-shortcuts")!).iconPositions.browser).toEqual({ x: 240, y: 120 })
  })

  it("resetsManualLayout", () => {
    setActivePinia(createPinia())
    const desktop = useDesktopStore()
    desktop.setIconPosition("browser", 240, 120)
    desktop.setSortMode("name")

    desktop.resetIconLayout()

    expect(desktop.shortcuts.iconPositions).toEqual({})
    expect(desktop.shortcuts.sortMode).toBe("manual")
  })

  it("recordsRecentLaunchOnce", () => {
    setActivePinia(createPinia())
    const desktop = useDesktopStore()
    desktop.recordRecentApp("browser")
    desktop.recordRecentApp("blog")
    desktop.recordRecentApp("browser")

    expect(desktop.shortcuts.recentApps.slice(0, 2)).toEqual(["browser", "blog"])
  })
})

describe("desktop icon and Start Menu interactions", () => {
  it("launchesCustomShortcutTarget", async () => {
    const browser = desktopApps.find((app) => app.id === "browser")!
    const wrapper = mount(IconGroup, { props: { apps: [{ ...browser, id: "shortcut-browser", launchAppId: "browser" } as typeof browser] } })

    await wrapper.find('[data-icon-id="shortcut-browser"]').trigger("click")
    await wrapper.find('[data-icon-id="shortcut-browser"]').trigger("click")

    expect(wrapper.emitted("open-app")?.[0]).toEqual(["browser"])
  })

  it("appliesSavedPositionToDesktopIcon", () => {
    const wrapper = mount(IconGroup, { props: { apps: [desktopApps.find((app) => app.id === "browser")!], positions: { browser: { x: 240, y: 120 } }, manualLayout: true } })

    expect(wrapper.find('[data-icon-id="browser"]').attributes("style")).toContain("left: 240px")
  })

  it("showsRecentAppsInStartMenu", () => {
    const wrapper = mount(StartMenu, { props: { recentApps: [desktopApps.find((app) => app.id === "browser")!] } })

    expect(wrapper.find('[data-testid="start-menu-recent"]').text()).toContain("Internet Explorer")
  })

  it("launchesRecentAppFromStartMenu", async () => {
    const wrapper = mount(StartMenu, { props: { recentApps: [desktopApps.find((app) => app.id === "browser")!] } })

    await wrapper.find('[data-testid="start-menu-recent"] button').trigger("click")

    expect(wrapper.emitted("launch")?.[0]).toEqual(["browser"])
  })

  it("keepsMobileIconsInTheirGrid", () => {
    const wrapper = mount(IconGroup, { props: { mobile: true, apps: [desktopApps.find((app) => app.id === "browser")!], positions: { browser: { x: 240, y: 120 } }, manualLayout: true } })

    expect(wrapper.find('[data-icon-id="browser"]').attributes("style")).toBeUndefined()
    expect(wrapper.find(".desktop-icons").classes()).toContain("desktop-icons-mobile")
  })

  it("movesAnIconWithPointerDrag", async () => {
    const wrapper = mount(IconGroup, { props: { apps: [desktopApps.find((app) => app.id === "browser")!], positions: { browser: { x: 30, y: 40 } } } })
    const icon = wrapper.find('[data-icon-id="browser"]')

    await icon.trigger("pointerdown", { button: 0, clientX: 10, clientY: 10 })
    await icon.trigger("pointermove", { clientX: 45, clientY: 50 })
    await icon.trigger("pointerup")

    expect(wrapper.emitted("move-icon")?.[0]).toEqual(["browser", 65, 80])
  })
})
