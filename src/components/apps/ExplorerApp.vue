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
const sortKey = ref<"name" | "type" | "size" | "modifiedAt">("name")
const sortAscending = ref(true)
const view = ref<"icons" | "details">("icons")
const contextMenu = ref<{ x: number; y: number; entryId?: string } | null>(null)
const previewEntry = ref<MockEntry | null>(null)
const dialog = ref({ visible: false, mode: "message" as "input" | "confirm" | "message", title: "", message: "", initialValue: "", action: "" as "new-folder" | "rename" | "delete" | "properties" | "error", entryId: "" })

const currentFolder = computed(() => filesystem.entryById(currentFolderId.value))
const entries = computed(() => filesystem.childrenOf(currentFolderId.value).slice().sort((a, b) => {
  if (sortKey.value === "name") return (a.name.localeCompare(b.name, "zh-CN") * (sortAscending.value ? 1 : -1))
  if (sortKey.value === "type") return (a.type.localeCompare(b.type, "zh-CN") * (sortAscending.value ? 1 : -1))
  if (sortKey.value === "size") return (a.size - b.size) * (sortAscending.value ? 1 : -1)
  return (a.modifiedAt - b.modifiedAt) * (sortAscending.value ? 1 : -1)
}))
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
const canBack = computed(() => backHistory.value.length > 0)
const canForward = computed(() => forwardHistory.value.length > 0)

function navigateTo(id: string, recordHistory = true) {
  const target = filesystem.entryById(id)
  if (!target || target.kind !== "folder" || target.id === currentFolderId.value) return
  if (recordHistory) backHistory.value.push(currentFolderId.value)
  if (recordHistory) forwardHistory.value = []
  currentFolderId.value = id
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
  if (entry) selectedIds.value = [entry.id]
  contextMenu.value = { x: Math.max(0, Math.min(event.clientX - bounds.left, bounds.width - 190)), y: Math.max(0, Math.min(event.clientY - bounds.top, bounds.height - 190)), entryId: entry?.id }
}
function closeContextMenu() { contextMenu.value = null }
function openSelected() { if (selectedEntry.value) openEntry(selectedEntry.value); closeContextMenu() }
function startNewFolder() {
  closeContextMenu()
  dialog.value = { visible: true, mode: "input", title: "新建文件夹", message: "请输入文件夹名称：", initialValue: "新建文件夹", action: "new-folder", entryId: "" }
}
function startRename() {
  const entry = selectedEntry.value
  if (!entry || entry.system) return
  closeContextMenu()
  dialog.value = { visible: true, mode: "input", title: "重命名", message: "请输入此项目的新名称：", initialValue: entry.name, action: "rename", entryId: entry.id }
}
function deleteSelected() {
  const entry = selectedEntry.value
  if (!entry || entry.system) return
  closeContextMenu()
  dialog.value = { visible: true, mode: "confirm", title: "确认删除", message: `确定要将“${entry.name}”移到回收站吗？`, initialValue: "", action: "delete", entryId: entry.id }
}
function showProperties() {
  const entry = selectedEntry.value
  if (!entry) return
  closeContextMenu()
  dialog.value = { visible: true, mode: "message", title: "属性", message: `${entry.name}\n${entry.kind === "folder" ? "文件夹" : entry.type}\n位置：${breadcrumbs.value.map((crumb) => crumb.name).join("\\")}`, initialValue: "", action: "properties", entryId: entry.id }
}
function applyDialog(value: string) {
  try {
    if (dialog.value.action === "new-folder") filesystem.createFolder(currentFolderId.value, value)
    else if (dialog.value.action === "rename") filesystem.rename(dialog.value.entryId, value)
    else if (dialog.value.action === "delete") {
      filesystem.moveToRecycleBin(dialog.value.entryId)
      selectedIds.value = selectedIds.value.filter((id) => id !== dialog.value.entryId)
    }
  } catch (error) {
    dialog.value = { ...dialog.value, visible: true, mode: "message", title: "无法完成操作", message: error instanceof Error ? error.message : "操作失败。", action: "error" }
  }
}
function setSort(key: "name" | "type" | "size" | "modifiedAt") {
  if (sortKey.value === key) sortAscending.value = !sortAscending.value
  else { sortKey.value = key; sortAscending.value = true }
}
function onExplorerKeyDown(event: KeyboardEvent) {
  if (event.target instanceof HTMLElement && (event.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName))) return
  if (event.key === "Escape") { closeContextMenu(); previewEntry.value = null; return }
  if (event.key === "Backspace") { event.preventDefault(); goUp(); return }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") { event.preventDefault(); selectedIds.value = entries.value.map((entry) => entry.id); return }
  if (event.key === "Delete" && selectedEntry.value && !selectedEntry.value.system) { deleteSelected(); return }
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
watch(() => props.initialFolderId, (id) => { if (id) navigateTo(id) })
</script>

<template>
  <div class="xp-explorer" @keydown="onExplorerKeyDown" @click="closeContextMenu" @contextmenu.prevent="openContext($event)">
    <ExplorerToolbar :breadcrumbs="breadcrumbs" :can-back="canBack" :can-forward="canForward" :view="view" @back="goBack" @forward="goForward" @up="goUp" @navigate="navigateTo" @refresh="refresh" @view="view = $event" @new-folder="startNewFolder" />
    <div class="xp-explorer-body">
      <aside class="xp-explorer-sidebar">
        <section class="xp-explorer-task"><h3>文件和文件夹任务</h3><button :disabled="!selectedEntry || selectedEntry.system" @click="startRename">✏️　重命名此项目</button><button :disabled="!selectedEntry || selectedEntry.system" @click="deleteSelected">🗑️　删除此项目</button><button @click="startNewFolder">📁　新建文件夹</button></section>
        <section class="xp-explorer-task"><h3>其他位置</h3><button @click="navigateTo('my-computer')">🖥️　我的电脑</button><button @click="navigateTo('my-documents')">📄　我的文档</button><button @click="navigateTo('desktop-folder')">🗂️　桌面</button><button @click="navigateTo('my-pictures')">🖼️　图片收藏</button><button @click="navigateTo('my-music')">🎵　我的音乐</button><button @click="windows.open('recycle')">{{ filesystem.recycleBinEntries.length ? '🗑️📄' : '🗑️' }}　回收站（{{ filesystem.recycleBinEntries.length }}）</button></section>
        <section class="xp-explorer-task"><h3>详细信息</h3><p>{{ selectedEntry?.name ?? currentFolder?.name }}</p><small>{{ selectedEntry ? (selectedEntry.kind === 'folder' ? '文件夹' : selectedEntry.type) : `${entries.length} 个对象` }}</small></section>
      </aside>
      <main class="xp-explorer-main" :class="`xp-explorer-${view}`" tabindex="0">
        <div v-if="view === 'details'" class="xp-explorer-columns"><span></span><button @click="setSort('name')">名称{{ sortKey === 'name' ? (sortAscending ? ' ▲' : ' ▼') : '' }}</button><button @click="setSort('type')">类型{{ sortKey === 'type' ? (sortAscending ? ' ▲' : ' ▼') : '' }}</button><button @click="setSort('size')">大小{{ sortKey === 'size' ? (sortAscending ? ' ▲' : ' ▼') : '' }}</button><button @click="setSort('modifiedAt')">修改日期{{ sortKey === 'modifiedAt' ? (sortAscending ? ' ▲' : ' ▼') : '' }}</button></div>
        <div class="xp-explorer-items" :class="{ 'xp-explorer-details-list': view === 'details' }">
          <FileItem v-for="entry in entries" :key="entry.id" :entry="entry" :view="view" :selected="selectedIds.includes(entry.id)" @select="selectEntry(entry, $event)" @open="openEntry(entry)" @context="openContext($event, entry)" />
          <div v-if="!entries.length" class="xp-explorer-empty">此文件夹为空。</div>
        </div>
      </main>
    </div>
    <footer class="xp-explorer-status"><span>{{ entries.length }} 个对象</span><span v-if="selectedIds.length">已选择 {{ selectedIds.length }} 个对象</span></footer>
    <div v-if="contextMenu" class="xp-context-menu xp-explorer-context" :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }" @click.stop>
      <button v-if="contextMenu.entryId" @click="openSelected">打开(O)</button>
      <button @click="startNewFolder">新建文件夹(W)</button>
      <button :disabled="!selectedEntry || selectedEntry.system" @click="startRename">重命名(M)</button>
      <button :disabled="!selectedEntry || selectedEntry.system" @click="deleteSelected">删除(D)</button>
      <hr />
      <button :disabled="!selectedEntry" @click="showProperties">属性(R)</button>
    </div>
    <DesktopActionDialog v-model="dialog.visible" :title="dialog.title" :message="dialog.message" :mode="dialog.mode" :initial-value="dialog.initialValue" @confirm="applyDialog" />
    <div v-if="previewEntry" class="xp-file-preview-backdrop" @click.self="previewEntry = null">
      <section class="xp-file-preview" role="dialog" aria-modal="true" :aria-label="previewEntry.name">
        <header><b>{{ previewEntry.name }}</b><button aria-label="关闭" @click="previewEntry = null">×</button></header>
        <main>
          <img v-if="previewEntry.type.startsWith('image/') && previewEntry.assetUrl" :src="previewEntry.assetUrl" :alt="previewEntry.name" />
          <audio v-else-if="previewEntry.type.startsWith('audio/') && previewEntry.assetUrl" :src="previewEntry.assetUrl" controls preload="metadata"></audio>
          <pre v-else>{{ previewEntry.content ?? '没有可预览的本地内容。' }}</pre>
        </main>
      </section>
    </div>
  </div>
</template>
