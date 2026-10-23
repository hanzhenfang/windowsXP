<script lang="ts" setup>
import { computed, ref } from "vue"
import { useFilesystemStore } from "@/store/filesystemStore"
import { getDesktopApp } from "@/apps/manifest"
import type { MockEntry } from "@/mocks/filesystem/types"
import ConfirmDialog from "./ConfirmDialog.vue"
import DesktopActionDialog from "@/components/desktop/DesktopActionDialog.vue"

const filesystem = useFilesystemStore()
const selectedIds = ref<string[]>([])
const pendingAction = ref<"restore" | "restore-all" | "delete" | "empty" | null>(null)
const confirmDialog = ref(false)
const messageDialog = ref({ visible: false, title: "", message: "" })
const recycleItems = computed(() => filesystem.recycleBinEntries.slice().sort((a, b) => b.modifiedAt - a.modifiedAt))
const selectedItems = computed(() => recycleItems.value.filter((item) => selectedIds.value.includes(item.id)))
const recycleIcon = getDesktopApp("recycle")?.icon ?? ""
const groupedCount = (root: MockEntry) => filesystem.snapshot.recycleBin.filter((item) => item.recycleGroupId === root.id).length
const originalLocation = (entry: MockEntry) => {
  const parent = entry.originalParentId ? filesystem.entryById(entry.originalParentId) : undefined
  return parent?.name ?? "原始位置不可用"
}

function selectItem(item: MockEntry, event: MouseEvent) {
  if (event.ctrlKey || event.metaKey) selectedIds.value = selectedIds.value.includes(item.id) ? selectedIds.value.filter((id) => id !== item.id) : [...selectedIds.value, item.id]
  else selectedIds.value = [item.id]
}
function ask(action: "restore" | "restore-all" | "delete" | "empty") {
  if ((action === "restore" || action === "delete") && !selectedItems.value.length) return
  pendingAction.value = action
  const text = action === "restore"
    ? `确定要还原选中的 ${selectedItems.value.length} 个项目吗？`
    : action === "restore-all"
      ? `确定要还原回收站中的全部 ${recycleItems.value.length} 个项目吗？`
    : action === "delete"
      ? `确定要永久删除选中的 ${selectedItems.value.length} 个项目吗？此操作无法撤销。`
      : `确定要清空回收站中的 ${recycleItems.value.length} 个项目吗？此操作无法撤销。`
  messageDialog.value = { ...messageDialog.value, visible: false }
  confirmDialog.value = true
  confirmationText.value = text
}
const confirmationText = ref("")
function runPendingAction() {
  try {
    if (pendingAction.value === "restore") selectedItems.value.forEach((item) => filesystem.restore(item.id))
    if (pendingAction.value === "restore-all") recycleItems.value.forEach((item) => filesystem.restore(item.id))
    if (pendingAction.value === "delete") selectedItems.value.forEach((item) => filesystem.permanentlyDelete(item.id))
    if (pendingAction.value === "empty") filesystem.emptyRecycleBin()
    selectedIds.value = []
  } catch (error) {
    messageDialog.value = { visible: true, title: "无法完成操作", message: error instanceof Error ? error.message : "操作失败。" }
  } finally {
    pendingAction.value = null
  }
}
function refresh() { filesystem.refresh(); selectedIds.value = [] }
function openContext(event: MouseEvent, item: MockEntry) {
  const root = (event.currentTarget as HTMLElement).closest(".xp-recycle-bin") as HTMLElement | null
  const bounds = root?.getBoundingClientRect()
  if (!bounds) return
  if (!selectedIds.value.includes(item.id)) selectedIds.value = [item.id]
  contextMenu.value = { x: Math.max(0, Math.min(event.clientX - bounds.left, bounds.width - 190)), y: Math.max(0, Math.min(event.clientY - bounds.top, bounds.height - 80)), itemId: item.id }
}
const contextMenu = ref<{ x: number; y: number; itemId: string } | null>(null)
function contextAction(action: "restore" | "delete") {
  if (contextMenu.value) selectedIds.value = [contextMenu.value.itemId]
  contextMenu.value = null
  ask(action)
}
function closeContext() { contextMenu.value = null }
function itemIcon(item: MockEntry) { return item.kind === "folder" ? "📁" : item.type.startsWith("image/") ? "🖼️" : item.type.startsWith("audio/") ? "🎵" : "📄" }
</script>

<template>
  <div class="xp-recycle-bin" @click="closeContext" @contextmenu.prevent="closeContext">
    <div class="xp-recycle-toolbar">
      <button :disabled="!selectedItems.length" @click="ask('restore')">↶　还原选中项目</button>
      <button :disabled="!recycleItems.length" @click="ask('restore-all')">还原所有项目</button>
      <button :disabled="!selectedItems.length" @click="ask('delete')">✖　永久删除</button>
      <button :disabled="!recycleItems.length" @click="ask('empty')">清空回收站</button>
      <button aria-label="刷新" @click="refresh">⟳</button>
    </div>
    <div class="xp-recycle-content">
      <aside class="xp-recycle-sidebar">
        <h3>回收站任务</h3>
        <button :disabled="!selectedItems.length" @click="ask('restore')">↶　还原此项目</button>
        <button :disabled="!recycleItems.length" @click="ask('restore-all')">↶　还原所有项目</button>
        <button :disabled="!selectedItems.length" @click="ask('delete')">✖　永久删除此项目</button>
        <button :disabled="!recycleItems.length" @click="ask('empty')">🗑️　清空回收站</button>
        <h3>详细信息</h3>
        <p>{{ selectedItems[0]?.name ?? (recycleItems.length ? `${recycleItems.length} 个项目` : "回收站为空") }}</p>
      </aside>
      <main class="xp-recycle-main">
        <div v-if="recycleItems.length" class="xp-recycle-columns"><span>名称</span><span>原始位置</span><span>删除日期</span><span>大小</span></div>
        <div v-if="recycleItems.length" class="xp-recycle-list">
          <button v-for="item in recycleItems" :key="item.id" class="xp-recycle-item" :class="{ selected: selectedIds.includes(item.id) }" @click.stop="selectItem(item, $event)" @contextmenu.stop.prevent="openContext($event, item)">
            <span><span class="xp-recycle-item-icon">{{ itemIcon(item) }}</span>{{ item.name }}</span>
            <span>{{ originalLocation(item) }}</span>
            <span>{{ new Intl.DateTimeFormat('zh-CN').format(item.deletedAt ?? item.modifiedAt) }}</span>
            <span>{{ groupedCount(item) > 1 ? `${groupedCount(item)} 个项目` : item.size ? `${Math.ceil(item.size / 1024)} KB` : "—" }}</span>
          </button>
        </div>
        <div v-else class="xp-recycle-empty"><img :src="recycleIcon" alt="空回收站" /><b>回收站为空</b><p>删除的文件和文件夹会显示在这里。</p></div>
      </main>
    </div>
    <footer class="xp-recycle-status"><span>{{ recycleItems.length }} 个项目</span><span v-if="selectedIds.length">已选择 {{ selectedIds.length }} 个</span></footer>
    <div v-if="contextMenu" class="xp-context-menu xp-recycle-context" :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }" @click.stop>
      <button @click="contextAction('restore')">还原(R)</button>
      <button @click="contextAction('delete')">永久删除(D)</button>
    </div>
    <ConfirmDialog v-model="confirmDialog" title="确认操作" :message="confirmationText" :confirm-text="pendingAction === 'restore' || pendingAction === 'restore-all' ? '还原' : pendingAction === 'delete' ? '永久删除' : '清空回收站'" @confirm="runPendingAction" />
    <DesktopActionDialog v-model="messageDialog.visible" mode="message" :title="messageDialog.title" :message="messageDialog.message" />
  </div>
</template>
