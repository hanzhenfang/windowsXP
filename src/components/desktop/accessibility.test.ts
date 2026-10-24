import { describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import { readFileSync } from "node:fs"
import IconGroup from "@/pages/DeskTop/IconGroup/index.vue"
import DesktopActionDialog from "@/components/desktop/DesktopActionDialog.vue"
import { desktopApps } from "@/apps/manifest"

const styles = readFileSync(`${process.cwd()}/src/global.css`, "utf8")

describe("desktop accessibility and responsive affordances", () => {
  it("moves keyboard focus between desktop icons", async () => {
    const apps = desktopApps.filter((app) => ["browser", "computer"].includes(app.id))
    const wrapper = mount(IconGroup, { props: { apps }, attachTo: document.body })
    const first = wrapper.find(`[data-icon-id="${apps[0].id}"]`)
    const second = wrapper.find(`[data-icon-id="${apps[1].id}"]`)
    ;(first.element as HTMLButtonElement).focus()

    await first.trigger("keydown", { key: "ArrowRight" })

    expect(document.activeElement).toBe(second.element)
    expect(first.attributes("aria-pressed")).toBe("false")
    wrapper.unmount()
  })

  it("labels the action dialog and its name field", async () => {
    const wrapper = mount(DesktopActionDialog, { props: { modelValue: false, title: "新建文件夹", message: "请输入文件夹名称：", mode: "input" } })
    await wrapper.setProps({ modelValue: true })

    expect(wrapper.get('[role="dialog"]').attributes("aria-label")).toBe("新建文件夹")
    expect(wrapper.get("input").attributes("aria-label")).toBe("项目名称")
  })

  it("provides visible focus, reduced motion, and mobile touch targets", () => {
    expect(styles).toContain(":focus-visible")
    expect(styles).toContain("prefers-reduced-motion: reduce")
    expect(styles).toContain(".xp-taskbar-mobile .xp-task-items button")
    expect(styles).toContain("min-height: 4.4rem")
  })
})
