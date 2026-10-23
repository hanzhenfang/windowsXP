<script lang="ts" setup>
import { ref } from "vue"
import type { DesktopApp } from "@/apps/manifest"
import type { MockEntry } from "@/mocks/filesystem/types"

const props = withDefaults(defineProps<{ mobile?: boolean; apps?: DesktopApp[]; folders?: MockEntry[]; selectedIds?: string[]; recycleCount?: number }>(), { mobile: false, apps: () => [], folders: () => [], selectedIds: () => [], recycleCount: 0 })
const emit = defineEmits<{
  (event: "select", id: string | null): void
  (event: "open-app", id: string): void
  (event: "open-folder", id: string): void
  (event: "context-icon", eventObject: MouseEvent, item: { id: string; type: "app" | "folder" }): void
}>()
const lastClick = ref({ id: "", time: 0 })

function activateApp(id: string, event: MouseEvent) {
  emit("select", id)
  if (props.mobile) {
    emit("open-app", id)
    return
  }
  const now = Date.now()
  if (lastClick.value.id === id && now - lastClick.value.time < 500) emit("open-app", id)
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
  <div class="desktop-icons" :class="{ 'desktop-icons-mobile': mobile }" @click.self="emit('select', null)">
    <button v-for="item in apps" :key="item.id" :data-icon-id="item.id" class="desktop-icon" :class="{ selected: selectedIds.includes(item.id) }" @click.stop="activateApp(item.id, $event)" @keydown.up.prevent="focusRelative($event, -1)" @keydown.down.prevent="focusRelative($event, 1)" @keydown.left.prevent="focusRelative($event, -1)" @keydown.right.prevent="focusRelative($event, 1)" @contextmenu.stop.prevent="emit('context-icon', $event, { id: item.id, type: 'app' })">
      <span class="desktop-icon-graphic"><img :src="item.icon" :alt="item.title" draggable="false" /><span v-if="item.id === 'recycle' && recycleCount" class="desktop-icon-recycle-full" :aria-label="`${recycleCount} 个已删除项目`">📄</span></span>
      <span>{{ item.title }}</span>
    </button>
    <button v-for="folder in folders" :key="folder.id" :data-icon-id="folder.id" class="desktop-icon" :class="{ selected: selectedIds.includes(folder.id) }" @click.stop="activateFolder(folder)" @keydown.up.prevent="focusRelative($event, -1)" @keydown.down.prevent="focusRelative($event, 1)" @keydown.left.prevent="focusRelative($event, -1)" @keydown.right.prevent="focusRelative($event, 1)" @contextmenu.stop.prevent="emit('context-icon', $event, { id: folder.id, type: 'folder' })">
      <span class="desktop-folder-icon" aria-hidden="true">📁</span>
      <span>{{ folder.name }}</span>
    </button>
  </div>
</template>
