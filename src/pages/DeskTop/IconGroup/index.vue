<script lang="ts" setup>
import { ref } from "vue"
import type { DesktopApp } from "@/apps/manifest"
import type { MockEntry } from "@/mocks/filesystem/types"

interface DesktopIconItem extends DesktopApp { launchAppId?: string; folderId?: string }
const props = withDefaults(defineProps<{ mobile?: boolean; apps?: DesktopIconItem[]; folders?: MockEntry[]; selectedIds?: string[]; recycleCount?: number; positions?: Record<string, { x: number; y: number }>; manualLayout?: boolean }>(), { mobile: false, apps: () => [], folders: () => [], selectedIds: () => [], recycleCount: 0, positions: () => ({}), manualLayout: true })
const emit = defineEmits<{
  (event: "select", id: string | null): void
  (event: "open-app", id: string): void
  (event: "open-folder", id: string): void
  (event: "context-icon", eventObject: MouseEvent, item: { id: string; type: "app" | "folder" }): void
  (event: "move-icon", id: string, x: number, y: number): void
}>()
const lastClick = ref({ id: "", time: 0 })
const drag = ref<{ id: string; startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null)
let suppressNextClickId = ""

function defaultPosition(index: number) {
  const rows = Math.max(1, Math.floor(((typeof window === "undefined" ? 768 : window.innerHeight) - 160) / 144))
  return { x: Math.floor(index / rows) * 136, y: (index % rows) * 144 }
}
function iconPosition(id: string, index: number) {
  if (!props.manualLayout || props.mobile) return undefined
  const position = props.positions[id] ?? defaultPosition(index)
  return { left: `${position.x}px`, top: `${position.y}px` }
}
function startDrag(event: PointerEvent, id: string, index: number) {
  if (props.mobile || !props.manualLayout || event.button !== 0) return
  emit("select", id)
  const origin = props.positions[id] ?? defaultPosition(index)
  drag.value = { id, startX: event.clientX, startY: event.clientY, originX: origin.x, originY: origin.y, moved: false }
}
function moveDrag(event: PointerEvent) {
  const active = drag.value
  if (!active) return
  const deltaX = event.clientX - active.startX
  const deltaY = event.clientY - active.startY
  if (!active.moved && Math.hypot(deltaX, deltaY) < 5) return
  active.moved = true
  const bounds = (event.currentTarget as HTMLElement).parentElement?.getBoundingClientRect()
  const width = bounds && bounds.width > 0 ? bounds.width : window.innerWidth
  const height = bounds && bounds.height > 0 ? bounds.height : window.innerHeight
  emit("move-icon", active.id, Math.max(0, Math.min(active.originX + deltaX, width - 136)), Math.max(0, Math.min(active.originY + deltaY, height - 144)))
}
function finishDrag() {
  if (drag.value?.moved) suppressNextClickId = drag.value.id
  drag.value = null
}

function activateApp(id: string, event: MouseEvent) {
  const suppressedId = suppressNextClickId
  suppressNextClickId = ""
  if (suppressedId === id) return
  emit("select", id)
  if (props.mobile) {
    emit("open-app", props.apps.find((app) => app.id === id)?.launchAppId ?? id)
    return
  }
  const now = Date.now()
  if (lastClick.value.id === id && now - lastClick.value.time < 500) emit("open-app", props.apps.find((app) => app.id === id)?.launchAppId ?? id)
  lastClick.value = { id, time: now }
}
function activateFolder(folder: MockEntry) {
  emit("select", folder.id)
  if (props.mobile) emit("open-folder", folder.id)
  else {
    const now = Date.now()
    if (lastClick.value.id === folder.id && now - lastClick.value.time < 500) emit("open-folder", folder.id)
    lastClick.value = { id: folder.id, time: now }
  }
}
function focusRelative(event: KeyboardEvent, offset: number) {
  const icons = Array.from(document.querySelectorAll<HTMLButtonElement>(".desktop-icon"))
  const index = icons.indexOf(event.currentTarget as HTMLButtonElement)
  icons[(index + offset + icons.length) % icons.length]?.focus()
}
</script>

<template>
  <div class="desktop-icons" :class="{ 'desktop-icons-mobile': mobile, 'desktop-icons-manual': manualLayout && !mobile }" @click.self="emit('select', null)">
    <button v-for="(item, index) in apps" :key="item.id" :data-icon-id="item.id" class="desktop-icon" :class="{ selected: selectedIds.includes(item.id) }" :aria-pressed="selectedIds.includes(item.id)" :style="iconPosition(item.id, index)" @click.stop="activateApp(item.id, $event)" @pointerdown.stop="startDrag($event, item.id, index)" @pointermove.stop="moveDrag" @pointerup.stop="finishDrag" @pointercancel.stop="finishDrag" @keydown.up.prevent="focusRelative($event, -1)" @keydown.down.prevent="focusRelative($event, 1)" @keydown.left.prevent="focusRelative($event, -1)" @keydown.right.prevent="focusRelative($event, 1)" @contextmenu.stop.prevent="emit('context-icon', $event, { id: item.id, type: item.folderId ? 'folder' : 'app' })">
      <span v-if="item.folderId" class="desktop-folder-icon" aria-hidden="true">📁</span>
      <span v-else class="desktop-icon-graphic"><img :src="item.icon" :alt="item.title" draggable="false" /><span v-if="item.id === 'recycle' && recycleCount" class="desktop-icon-recycle-full" :aria-label="`${recycleCount} 个已删除项目`">📄</span></span>
      <span>{{ item.title }}</span>
    </button>
    <button v-for="(folder, index) in folders" :key="folder.id" :data-icon-id="folder.id" class="desktop-icon" :class="{ selected: selectedIds.includes(folder.id) }" :aria-pressed="selectedIds.includes(folder.id)" :style="iconPosition(folder.id, apps.length + index)" @click.stop="activateFolder(folder)" @pointerdown.stop="startDrag($event, folder.id, apps.length + index)" @pointermove.stop="moveDrag" @pointerup.stop="finishDrag" @pointercancel.stop="finishDrag" @keydown.up.prevent="focusRelative($event, -1)" @keydown.down.prevent="focusRelative($event, 1)" @keydown.left.prevent="focusRelative($event, -1)" @keydown.right.prevent="focusRelative($event, 1)" @contextmenu.stop.prevent="emit('context-icon', $event, { id: folder.id, type: 'folder' })">
      <span class="desktop-folder-icon" aria-hidden="true">📁</span><span>{{ folder.name }}</span>
    </button>
  </div>
</template>
