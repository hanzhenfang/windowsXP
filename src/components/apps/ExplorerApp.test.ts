import { beforeEach, describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import { createPinia, setActivePinia } from "pinia"
import ExplorerApp from "@/components/apps/ExplorerApp.vue"
import { useFilesystemStore } from "@/store/filesystemStore"

function mountExplorer(initialFolderId = "my-documents") {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(ExplorerApp, { props: { initialFolderId }, global: { plugins: [pinia] } })
}

async function pressOnMain(wrapper: ReturnType<typeof mountExplorer>, key: string, options: KeyboardEventInit = {}) {
  await wrapper.get(".xp-explorer-main").trigger("keydown", { key, ...options })
}

function fileButton(wrapper: ReturnType<typeof mountExplorer>, name: string) {
  const button = wrapper.findAll(".xp-file-item").find((item) => item.text().includes(name))
  if (!button) throw new Error(`Missing file button: ${name}`)
  return button
}

describe("local Explorer workflows", () => {
  beforeEach(() => { localStorage.clear() })

  it("searchesCurrentFolderSubtree", async () => {
    const wrapper = mountExplorer()

    await wrapper.get('input[aria-label="搜索此文件夹及其子文件夹"]').setValue("完全在浏览器")

    expect(wrapper.find('[data-file-id="sample-readme"]').exists()).toBe(true)
    expect(wrapper.find('[data-file-id="sample-blog-link"]').exists()).toBe(false)
    expect(wrapper.find(".xp-explorer-status").text()).toContain("1 个对象")
  })

  it("doesNotHijackTextInputShortcuts", async () => {
    const wrapper = mountExplorer()
    await wrapper.get('[data-file-id="sample-readme"]').trigger("click")
    const search = wrapper.get('input[aria-label="搜索此文件夹及其子文件夹"]')
    await search.setValue("xp")
    await search.trigger("keydown", { key: "a", ctrlKey: true })

    expect(wrapper.findAll(".xp-file-item.selected")).toHaveLength(1)
    expect((search.element as HTMLInputElement).value).toBe("xp")
  })

  it("opensSelectedFileWithEnter", async () => {
    const wrapper = mountExplorer()
    await wrapper.get('[data-file-id="sample-readme"]').trigger("click")
    await pressOnMain(wrapper, "Enter")

    expect(wrapper.get('[role="dialog"]').attributes("aria-label")).toBe("欢迎使用 Windows XP.txt")
  })

  it("opensContextMenuWithShiftF10", async () => {
    const wrapper = mountExplorer()
    await wrapper.get('[data-file-id="sample-readme"]').trigger("click")
    await pressOnMain(wrapper, "F10", { shiftKey: true })

    expect(wrapper.get(".xp-explorer-context").text()).toContain("复制(C)")
    expect(wrapper.get(".xp-explorer-context").text()).toContain("打开(O)")
  })

  it("pastesCopiedItemsIntoCurrentFolder", async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const filesystem = useFilesystemStore()
    filesystem.createFolder("my-documents", "目标")
    const wrapper = mount(ExplorerApp, { props: { initialFolderId: "my-documents" }, global: { plugins: [pinia] } })
    await wrapper.get('[data-file-id="sample-readme"]').trigger("click")
    await pressOnMain(wrapper, "c", { ctrlKey: true })
    await fileButton(wrapper, "目标").trigger("dblclick")
    await pressOnMain(wrapper, "v", { ctrlKey: true })

    const copied = filesystem.entries.filter((entry) => entry.parentId === filesystem.entries.find((item) => item.name === "目标")?.id)
    expect(copied).toHaveLength(1)
    expect(copied[0]).toMatchObject({ name: "欢迎使用 Windows XP.txt - 副本", content: expect.stringContaining("本地 mock") })
    expect(copied[0].id).not.toBe("sample-readme")
  })

  it("movesCutFolderWithDescendants", async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const filesystem = useFilesystemStore()
    const wrapper = mount(ExplorerApp, { props: { initialFolderId: "drive-c" }, global: { plugins: [pinia] } })
    await fileButton(wrapper, "我的文档").trigger("click")
    await pressOnMain(wrapper, "x", { ctrlKey: true })
    await fileButton(wrapper, "桌面").trigger("dblclick")
    await pressOnMain(wrapper, "v", { ctrlKey: true })

    expect(filesystem.entryById("my-documents")?.parentId).toBe("desktop-folder")
    expect(filesystem.entryById("sample-readme")?.parentId).toBe("my-documents")
    expect(filesystem.entryById("sample-blog-link")?.parentId).toBe("my-documents")
  })

  it("deletesMultipleRootsOnce", async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const filesystem = useFilesystemStore()
    filesystem.createFile("my-documents", "临时一.txt", "a")
    filesystem.createFile("my-documents", "临时二.txt", "b")
    const wrapper = mount(ExplorerApp, { props: { initialFolderId: "my-documents" }, global: { plugins: [pinia] } })
    await fileButton(wrapper, "临时一.txt").trigger("click")
    await fileButton(wrapper, "临时二.txt").trigger("click", { ctrlKey: true })
    await pressOnMain(wrapper, "Delete")
    await wrapper.get('[role="dialog"] button.primary').trigger("click")

    expect(filesystem.entries.some((entry) => entry.name === "临时一.txt" || entry.name === "临时二.txt")).toBe(false)
    expect(filesystem.recycleBinEntries.map((entry) => entry.name)).toEqual(expect.arrayContaining(["临时一.txt", "临时二.txt"]))
  })
})
