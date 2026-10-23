<script lang="ts" setup>
import { computed, ref, watch } from "vue"
import { useFilesystemStore } from "@/store/filesystemStore"
import type { MockEntry } from "@/mocks/filesystem/types"
import ExplorerToolbar, { type ExplorerBreadcrumb } from "./ExplorerToolbar.vue"
import FileItem from "./FileItem.vue"
import DesktopActionDialog from "@/components/desktop/DesktopActionDialog.vue"
import { useWindowStore } from "@/store/windowStore"

const props = defineProps<{ initialFolderId?: string }>()
const filesystem = useFilesystemStore()
const windows = useWindowStore()
const currentFolderId = ref(props.initialFolderId && filesystem.entryById(props.initialFolderId) ? props.initialFolderId : "my-computer")
const backHistory = ref<string[]>([])
const forwardHistory = ref<string[]>([])
const selectedIds = ref<string[]>([])
const searchQuery = ref("")
const clipboard = ref<{ mode: "copy" | "cut"; ids: string[] } | null>(null)
const sortKey = ref<"name" | "type" | "size" | "modifiedAt">("name")
const sortAscending = ref(true)
const view = ref<"icons" | "details">("icons")
const contextMenu = ref<{ x: number; y: number; entryId?: string } | null>(null)
const previewEntry = ref<MockEntry | null>(null)
const dialog = ref({ visible: false, mode: "message" as "input" | "confirm" | "message", title: "", message: "", initialValue: "", action: "" as "new-folder" | "rename" | "delete" | "properties" | "error", entryId: "", entryIds: [] as string[] })

const currentFolder = computed(() => filesystem.entryById(currentFolderId.value))
const entries = computed(() => filesystem.childrenOf(currentFolderId.value).slice().sort((a, b) => {
  if (sortKey.value === "name") return (a.name.localeCompare(b.name, "zh-CN") * (sortAscending.value ? 1 : -1))
  if (sortKey.value === "type") return (a.type.localeCompare(b.type, "zh-CN") * (sortAscending.value ? 1 : -1))
  if (sortKey.value === "size") return (a.size - b.size) * (sortAscending.value ? 1 : -1)
  return (a.modifiedAt - b.modifiedAt) * (sortAscending.value ? 1 : -1)
}))
const displayEntries = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  if (!query) return entries.value
  const result: MockEntry[] = []
  const queue = [...entries.value]
  const visited = new Set<string>()
  while (queue.length) {
    const entry = queue.shift()!
    if (visited.has(entry.id)) continue
    visited.add(entry.id)
    if (entry.name.toLocaleLowerCase().includes(query) || entry.content?.toLocaleLowerCase().includes(query)) result.push(entry)
    if (entry.kind === "folder") queue.push(...filesystem.childrenOf(entry.id))
  }
  return result.sort((a, b) => a.kind === b.kind ? a.name.localeCompare(b.name, "zh-CN") : a.kind === "folder" ? -1 : 1)
})
const breadcrumbs = computed<ExplorerBreadcrumb[]>(() => {
  const result: ExplorerBreadcrumb[] = []
  let entry = currentFolder.value
  while (entry) {
    result.unshift({ id: entry.id, name: entry.name })
    entry = entry.parentId ? filesystem.entryById(entry.parentId) : undefined
  }
  return result
})
const selectedEntry = computed(() => selectedIds.value.length === 1 ? filesystem.entryById(selectedIds.value[0]) : undefined)
const selectedEntries = computed(() => selectedIds.value.map((id) => filesystem.entryById(id)).filter((entry): entry is MockEntry => Boolean(entry)))
const canDeleteSelection = computed(() => selectedEntries.value.length > 0 && selectedEntries.value.every((entry) => !entry.system && entry.parentId !== null))
const canCopySelection = computed(() => selectedEntries.value.length > 0 && selectedEntries.value.every((entry) => entry.parentId !== null && (!entry.system || entry.kind === "file")))
const canBack = computed(() => backHistory.value.length > 0)
const canForward = computed(() => forwardHistory.value.length > 0)

function navigateTo(id: string, recordHistory = true) {
  const target = filesystem.entryById(id)
  if (!target || target.kind !== "folder" || target.id === currentFolderId.value) return
  if (recordHistory) backHistory.value.push(currentFolderId.value)
  if (recordHistory) forwardHistory.value = []
  currentFolderId.value = id
  searchQuery.value = ""
  selectedIds.value = []
  closeContextMenu()
}
function goBack() {
  const previous = backHistory.value.pop()
  if (!previous) return
  forwardHistory.value.push(currentFolderId.value)
  navigateTo(previous, false)
}
function goForward() {
  const next = forwardHistory.value.pop()
  if (!next) return
  backHistory.value.push(currentFolderId.value)
  navigateTo(next, false)
}
function goUp() { if (currentFolder.value?.parentId) navigateTo(currentFolder.value.parentId) }
function refresh() { filesystem.refresh(); selectedIds.value = []; closeContextMenu() }
function selectEntry(entry: MockEntry, event: MouseEvent) {
  closeContextMenu()
  if (event.ctrlKey || event.metaKey) {
    selectedIds.value = selectedIds.value.includes(entry.id) ? selectedIds.value.filter((id) => id !== entry.id) : [...selectedIds.value, entry.id]
  } else if (event.shiftKey && selectedIds.value.length) {
    const from = entries.value.findIndex((item) => item.id === selectedIds.value[selectedIds.value.length - 1])
    const to = entries.value.findIndex((item) => item.id === entry.id)
    selectedIds.value = entries.value.slice(Math.min(from, to), Math.max(from, to) + 1).map((item) => item.id)
  } else selectedIds.value = [entry.id]
}
function openEntry(entry: MockEntry) {
  if (entry.kind === "folder") navigateTo(entry.id)
  else previewEntry.value = entry
}
function openContext(event: MouseEvent, entry?: MockEntry) {
  const shell = (event.currentTarget as HTMLElement).closest(".xp-explorer") as HTMLElement | null
  const bounds = shell?.getBoundingClientRect()
  if (!bounds) return
  if (entry && !selectedIds.value.includes(entry.id)) selectedIds.value = [entry.id]
  contextMenu.value = { x: Math.max(0, Math.min(event.clientX - bounds.left, bounds.width - 190)), y: Math.max(0, Math.min(event.clientY - bounds.top, bounds.height - 190)), entryId: entry?.id }
}
function closeContextMenu() { contextMenu.value = null }
function openSelected() { if (selectedEntry.value) openEntry(selectedEntry.value); closeContextMenu() }
function startNewFolder() {
  closeContextMenu()
  dialog.value = { visible: true, mode: "input", title: "新建文件夹", message: "请输入文件夹名称：", initialValue: "新建文件夹", action: "new-folder", entryId: "", entryIds: [] }
}
function startRename() {
  const entry = selectedEntry.value
  if (!entry || entry.system) return
  closeContextMenu()
  dialog.value = { visible: true, mode: "input", title: "重命名", message: "请输入此项目的新名称：", initialValue: entry.name, action: "rename", entryId: entry.id, entryIds: [] }
}
function deleteSelected() {
  if (!canDeleteSelection.value) return
  const names = selectedEntries.value.map((entry) => `“${entry.name}”`).join("、")
  closeContextMenu()
  dialog.value = { visible: true, mode: "confirm", title: "确认删除", message: `确定要将${names}移到回收站吗？`, initialValue: "", action: "delete", entryId: "", entryIds: [...selectedIds.value] }
}
function showProperties() {
  const entry = selectedEntry.value
  if (!entry) return
  closeContextMenu()
  dialog.value = { visible: true, mode: "message", title: "属性", message: `${entry.name}\n${entry.kind === "folder" ? "文件夹" : entry.type}\n位置：${breadcrumbs.value.map((crumb) => crumb.name).join("\\")}`, initialValue: "", action: "properties", entryId: entry.id, entryIds: [] }
}
function applyDialog(value: string) {
  try {
    if (dialog.value.action === "new-folder") filesystem.createFolder(currentFolderId.value, value)
    else if (dialog.value.action === "rename") filesystem.rename(dialog.value.entryId, value)
    else if (dialog.value.action === "delete") { filesystem.moveEntriesToRecycleBin(dialog.value.entryIds); selectedIds.value = [] }
  } catch (error) {
    dialog.value = { ...dialog.value, visible: true, mode: "message", title: "无法完成操作", message: error instanceof Error ? error.message : "操作失败。", action: "error" }
  }
}
function copySelected() {
  if (canCopySelection.value) clipboard.value = { mode: "copy", ids: [...selectedIds.value] }
}
function cutSelected() {
  if (canCopySelection.value && canDeleteSelection.value) clipboard.value = { mode: "cut", ids: [...selectedIds.value] }
}
function pasteClipboard() {
  if (!clipboard.value) return
  try {
    if (clipboard.value.mode === "copy") filesystem.copyEntries(clipboard.value.ids, currentFolderId.value)
    else { filesystem.moveEntries(clipboard.value.ids, currentFolderId.value); clipboard.value = null }
    selectedIds.value = []
  } catch (error) {
    dialog.value = { visible: true, mode: "message", title: "无法完成操作", message: error instanceof Error ? error.message : "操作失败。", initialValue: "", action: "error", entryId: "", entryIds: [] }
  }
}
function setSort(key: "name" | "type" | "size" | "modifiedAt") {
  if (sortKey.value === key) sortAscending.value = !sortAscending.value
  else { sortKey.value = key; sortAscending.value = true }
}
function formatPreviewSize(size: number) {
  if (size < 1024) return `${size} 字节`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
function formatPreviewDate(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(timestamp)
}
function onExplorerKeyDown(event: KeyboardEvent) {
  if (event.target instanceof HTMLElement && (event.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName))) return
  if (dialog.value.visible) return
  if (event.key === "Escape") { closeContextMenu(); previewEntry.value = null; return }
  if (event.key === "Backspace") { event.preventDefault(); goUp(); return }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") { event.preventDefault(); selectedIds.value = entries.value.map((entry) => entry.id); return }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c" && canCopySelection.value) { event.preventDefault(); copySelected(); return }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "x" && canDeleteSelection.value) { event.preventDefault(); cutSelected(); return }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v" && clipboard.value) { event.preventDefault(); pasteClipboard(); return }
  if (event.key === "Delete" && canDeleteSelection.value) { deleteSelected(); return }
  if (event.key === "F2") { startRename(); return }
  if (event.key === "Enter" && selectedEntry.value) openEntry(selectedEntry.value)
  if (["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(event.key) && entries.value.length) {
    event.preventDefault()
    const currentIndex = entries.value.findIndex((entry) => entry.id === selectedIds.value[0])
    const delta = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1
    const next = entries.value[(currentIndex + delta + entries.value.length) % entries.value.length]
    selectedIds.value = [next.id]
    document.querySelector<HTMLElement>(`[data-file-id="${CSS.escape(next.id)}"]`)?.focus()
  }
}
watch(displayEntries, (visibleEntries) => {
  const visible = new Set(visibleEntries.map((entry) => entry.id))
  selectedIds.value = selectedIds.value.filter((id) => visible.has(id))
})
watch(() => props.initialFolderId, (id) => { if (id) navigateTo(id) })
</script>

<template>
  <div class="xp-explorer" @keydown="onExplorerKeyDown" @click="closeContextMenu" @contextmenu.prevent="openContext($event)">
    <ExplorerToolbar :breadcrumbs="breadcrumbs" :can-back="canBack" :can-forward="canForward" :view="view" :search-query="searchQuery" :can-copy="canCopySelection" :can-paste="Boolean(clipboard)" @update:search-query="searchQuery = $event" @copy="copySelected" @cut="cutSelected" @paste="pasteClipboard" @back="goBack" @forward="goForward" @up="goUp" @navigate="navigateTo" @refresh="refresh" @view="view = $event" @new-folder="startNewFolder" />
    <div class="xp-explorer-body">
      <aside class="xp-explorer-sidebar">
        <section class="xp-explorer-task"><h3>文件和文件夹任务</h3><button :disabled="!selectedEntry || selectedEntry.system" @click="startRename">✏️　重命名此项目</button><button :disabled="!canDeleteSelection" @click="deleteSelected">🗑️　删除所选项目</button><button :disabled="!canCopySelection" @click="copySelected">📄　复制所选项目</button><button :disabled="!canDeleteSelection" @click="cutSelected">✂️　剪切所选项目</button><button :disabled="!clipboard" @click="pasteClipboard">📋　粘贴到此处</button><button @click="startNewFolder">📁　新建文件夹</button></section>
        <section class="xp-explorer-task"><h3>其他位置</h3><button @click="navigateTo('my-computer')">🖥️　我的电脑</button><button @click="navigateTo('my-documents')">📄　我的文档</button><button @click="navigateTo('desktop-folder')">🗂️　桌面</button><button @click="navigateTo('my-pictures')">🖼️　图片收藏</button><button @click="navigateTo('my-music')">🎵　我的音乐</button><button @click="windows.open('recycle')">{{ filesystem.recycleBinEntries.length ? '🗑️📄' : '🗑️' }}　回收站（{{ filesystem.recycleBinEntries.length }}）</button></section>
        <section class="xp-explorer-task"><h3>详细信息</h3><p>{{ selectedEntry?.name ?? currentFolder?.name }}</p><small>{{ selectedEntry ? (selectedEntry.kind === 'folder' ? '文件夹' : selectedEntry.type) : `${entries.length} 个对象` }}</small></section>
      </aside>
      <main class="xp-explorer-main" :class="`xp-explorer-${view}`" tabindex="0">
        <div v-if="view === 'details'" class="xp-explorer-columns"><span></span><button @click="setSort('name')">名称{{ sortKey === 'name' ? (sortAscending ? ' ▲' : ' ▼') : '' }}</button><button @click="setSort('type')">类型{{ sortKey === 'type' ? (sortAscending ? ' ▲' : ' ▼') : '' }}</button><button @click="setSort('size')">大小{{ sortKey === 'size' ? (sortAscending ? ' ▲' : ' ▼') : '' }}</button><button @click="setSort('modifiedAt')">修改日期{{ sortKey === 'modifiedAt' ? (sortAscending ? ' ▲' : ' ▼') : '' }}</button></div>
        <div class="xp-explorer-items" :class="{ 'xp-explorer-details-list': view === 'details' }">
          <FileItem v-for="entry in displayEntries" :key="entry.id" :entry="entry" :view="view" :selected="selectedIds.includes(entry.id)" @select="selectEntry(entry, $event)" @open="openEntry(entry)" @context="openContext($event, entry)" />
          <div v-if="!displayEntries.length" class="xp-explorer-empty">{{ searchQuery ? '没有找到匹配的项目。' : '此文件夹为空。' }}</div>
        </div>
      </main>
    </div>
    <footer class="xp-explorer-status"><span>{{ entries.length }} 个对象</span><span v-if="selectedIds.length">已选择 {{ selectedIds.length }} 个对象</span></footer>
    <div v-if="contextMenu" class="xp-context-menu xp-explorer-context" :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }" @click.stop>
      <button v-if="contextMenu.entryId" @click="openSelected">打开(O)</button>
      <button @click="startNewFolder">新建文件夹(W)</button>
      <button :disabled="!canCopySelection" @click="copySelected">复制(C)</button>
      <button :disabled="!canDeleteSelection" @click="cutSelected">剪切(X)</button>
      <button :disabled="!clipboard" @click="pasteClipboard">粘贴(V)</button>
      <button :disabled="!selectedEntry || selectedEntry.system" @click="startRename">重命名(M)</button>
      <button :disabled="!canDeleteSelection" @click="deleteSelected">删除(D)</button>
      <hr />
      <button :disabled="!selectedEntry" @click="showProperties">属性(R)</button>
    </div>
    <DesktopActionDialog v-model="dialog.visible" :title="dialog.title" :message="dialog.message" :mode="dialog.mode" :initial-value="dialog.initialValue" @confirm="applyDialog" />
    <div v-if="previewEntry" class="xp-file-preview-backdrop" @click.self="previewEntry = null">
      <section class="xp-file-preview" role="dialog" aria-modal="true" :aria-label="previewEntry.name">
        <header><b>{{ previewEntry.name }}</b><button aria-label="关闭" @click="previewEntry = null">×</button></header>
        <main>
          <dl class="xp-file-preview-metadata">
            <div><dt>类型</dt><dd>{{ previewEntry.kind === 'folder' ? '文件夹' : previewEntry.type }}</dd></div>
            <div><dt>大小</dt><dd>{{ formatPreviewSize(previewEntry.size) }}</dd></div>
            <div><dt>修改日期</dt><dd>{{ formatPreviewDate(previewEntry.modifiedAt) }}</dd></div>
          </dl>
          <img v-if="previewEntry.type.startsWith('image/') && previewEntry.assetUrl" :src="previewEntry.assetUrl" :alt="previewEntry.name" />
          <audio v-else-if="previewEntry.type.startsWith('audio/') && previewEntry.assetUrl" :src="previewEntry.assetUrl" controls preload="metadata"></audio>
          <pre v-else>{{ previewEntry.content ?? '没有可预览的本地内容。' }}</pre>
        </main>
      </section>
    </div>
  </div>
</template>
