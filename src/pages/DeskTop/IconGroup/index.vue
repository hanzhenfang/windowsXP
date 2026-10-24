<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { getDesktopApp } from "@/apps/manifest"
import { useWindowStore } from "@/store/windowStore"

const props = withDefaults(defineProps<{ mobile?: boolean }>(), { mobile: false })
const store = useWindowStore()
const selectedId = ref<string | null>(null)
const isRefreshing = ref(false)
const contextMenu = ref<{ x: number; y: number; id: string; appId: string } | null>(null)
let refreshTimer = 0
const desktopIcons = computed(() => store.desktopIcons.slice().sort((a, b) => {
  if (store.iconSort === "default") return 0
  if (store.iconSort === "type") {
    const aType = getDesktopApp(a.appId)?.kind ?? ""
    const bType = getDesktopApp(b.appId)?.kind ?? ""
    return aType.localeCompare(bType) || a.title.localeCompare(b.title, "zh-CN")
  }
  return a.title.localeCompare(b.title, "zh-CN")
}))
watch(() => store.desktopRevision, () => {
  isRefreshing.value = true
  window.clearTimeout(refreshTimer)
  refreshTimer = window.setTimeout(() => { isRefreshing.value = false }, 720)
})
onBeforeUnmount(() => window.clearTimeout(refreshTimer))

function activate(appId: string, id: string, event: MouseEvent) {
  selectedId.value = id
  if (props.mobile || event.detail >= 2) store.openApp(appId)
}
function showContextMenu(item: { id: string; appId: string }, event: MouseEvent) {
  if (props.mobile) return
  event.preventDefault()
  event.stopPropagation()
  selectedId.value = item.id
  const bounds = (event.currentTarget as HTMLElement).closest(".xp-desktop")?.getBoundingClientRect()
  if (!bounds) return
  contextMenu.value = { x: Math.max(0, Math.min(event.clientX - bounds.left, bounds.width - 180)), y: Math.max(0, Math.min(event.clientY - bounds.top, bounds.height - 150)), ...item }
}
function closeContextMenu() { contextMenu.value = null }
function createCopy() {
  if (contextMenu.value) store.copyShortcut(contextMenu.value.appId)
  closeContextMenu()
}
function createAnotherShortcut() {
  if (contextMenu.value) store.createShortcut(contextMenu.value.appId)
  closeContextMenu()
}
function removeShortcut() {
  if (contextMenu.value) store.removeShortcut(contextMenu.value.id)
  closeContextMenu()
}
</script>

<template>
  <div class="desktop-icons" :class="[{ 'desktop-icons-mobile': mobile }, `desktop-icons-${store.iconLayout}`]" @click.self="selectedId = null; closeContextMenu()" @contextmenu.self.prevent="closeContextMenu">
    <button v-for="(item, index) in desktopIcons" :key="item.id" class="desktop-icon" :class="{ selected: selectedId === item.id, 'desktop-icon-refreshing': isRefreshing }" :style="isRefreshing ? { animationDelay: `${index * 35}ms` } : undefined" @click.stop="activate(item.appId, item.id, $event)" @contextmenu="showContextMenu(item, $event)" @keydown.enter="store.openApp(item.appId)">
      <img :src="item.icon" :alt="item.title" draggable="false" />
      <span>{{ item.title }}</span>
    </button>
    <div v-if="contextMenu" class="xp-context-menu icon-context-menu" :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }" @click.stop>
      <button @click="store.openApp(contextMenu.appId); closeContextMenu()">打开(O)</button>
      <button @click="store.openProperties(contextMenu.appId, contextMenu.id); closeContextMenu()">属性(R)</button>
      <button @click="createCopy">复制(C)</button>
      <button v-if="contextMenu.id.includes('-shortcut-')" @click="removeShortcut">删除快捷方式</button>
      <button @click="createAnotherShortcut">创建快捷方式</button>
    </div>
  </div>
</template>
