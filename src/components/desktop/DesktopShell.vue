<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { desktopApps } from "@/apps/manifest"
import { useWindowStore } from "@/store/windowStore"
import { useDesktopStore } from "@/store/desktopStore"
import { useFilesystemStore } from "@/store/filesystemStore"
import { useSystemAudio } from "@/composables/useSystemAudio"
import IconGroup from "@/pages/DeskTop/IconGroup/index.vue"
import AppWindow from "@/components/Window/AppWindow.vue"
import Taskbar from "./Taskbar.vue"
import DesktopContextMenu from "./DesktopContextMenu.vue"
import ShortcutPickerDialog from "./ShortcutPickerDialog.vue"
import DesktopActionDialog from "./DesktopActionDialog.vue"
import DeskBg from "@/assets/deskbg.jpg"
import DesktopBackground from "@/assets/desktopBackground.jpg"
import LoginAudio from "@/assets/audio/login.mp3"
import { usePreferencesStore } from "@/store/preferencesStore"
import { usePowerStore } from "@/store/powerStore"

const props = withDefaults(defineProps<{ mobile?: boolean }>(), { mobile: false })
const windows = useWindowStore()
const desktop = useDesktopStore()
const filesystem = useFilesystemStore()
const preferences = usePreferencesStore()
const power = usePowerStore()
const router = useRouter()
const { play } = useSystemAudio()
const audio = ref<HTMLAudioElement>()
const contextMenu = ref<{ x: number; y: number; appId?: string; folderId?: string } | null>(null)
const dialog = ref({ visible: false, mode: "message" as "input" | "confirm" | "message", title: "", message: "", initialValue: "", action: "" as "rename" | "new-folder" | "delete" | "properties" | "error", appId: "", folderId: "" })
const selectionBox = ref<{ left: number; top: number; width: number; height: number } | null>(null)
const selectionStart = ref<{ x: number; y: number; clientX: number; clientY: number } | null>(null)
const shortcutPickerVisible = ref(false)
const selectedApp = computed(() => contextMenu.value?.appId ? sortedApps.value.find((app) => app.id === contextMenu.value?.appId) : undefined)
const selectedFolder = computed(() => contextMenu.value?.folderId ? filesystem.entryById(contextMenu.value.folderId) : undefined)
const sortedApps = computed(() => {
  const hidden = new Set(desktop.shortcuts.hidden)
  const visible = desktopApps.filter((app) => app.desktopVisible !== false && !hidden.has(app.id)).map((app) => ({ ...app, title: desktop.shortcuts.titles[app.id] ?? app.title, launchAppId: app.id }))
  const custom = desktop.shortcuts.custom.flatMap((shortcut) => {
    const app = desktopApps.find((candidate) => candidate.id === shortcut.appId)
    return app ? [{ ...app, id: shortcut.id, title: shortcut.title, launchAppId: app.id, system: false }] : []
  })
  const items = [...visible, ...custom]
  if (desktop.shortcuts.sortMode === "name") return items.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"))
  if (desktop.shortcuts.sortMode === "type") return items.sort((a, b) => a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title, "zh-CN"))
  return items
})
const desktopFolders = computed(() => filesystem.childrenOf("desktop-folder").filter((entry) => entry.kind === "folder"))
const recycleCount = computed(() => filesystem.recycleBinEntries.length)
const desktopClass = computed(() => ({
  "xp-mobile-desktop": props.mobile,
  "xp-icons-small": preferences.iconSize === "small",
  [`xp-theme-${preferences.themeColor}`]: true,
}))
const wallpaper = computed(() => preferences.wallpaperId === "desktop-background" ? DesktopBackground : DeskBg)

function positionContextMenu(event: MouseEvent, target?: { appId?: string; folderId?: string }) {
  const root = document.getElementById("desktop-shell")
  const bounds = root?.getBoundingClientRect()
  if (!bounds) return
  contextMenu.value = {
    x: Math.max(0, Math.min(event.clientX - bounds.left, bounds.width - 190)),
    y: Math.max(0, Math.min(event.clientY - bounds.top, bounds.height - 280)),
    ...target,
  }
}

function handleBlankContextMenu(event: MouseEvent) {
  if (props.mobile) return
  const target = event.target as HTMLElement
  if (target.closest(".desktop-icon, .xp-window, .xp-taskbar, .xp-context-menu")) return
  event.preventDefault()
  positionContextMenu(event)
}

function handleIconContextMenu(event: MouseEvent, item: { id: string; type: "app" | "folder" }) {
  if (props.mobile) return
  event.preventDefault()
  event.stopPropagation()
  desktop.selectedId = item.id
  desktop.selectedIds = [item.id]
  positionContextMenu(event, item.type === "app" ? { appId: item.id } : { folderId: item.id })
}

function closeContextMenu() { contextMenu.value = null }
function openSelected() {
  if (contextMenu.value?.appId) launchApp(selectedApp.value?.launchAppId ?? contextMenu.value.appId)
  if (contextMenu.value?.folderId) launchApp("computer", contextMenu.value.folderId)
  closeContextMenu()
}
function renameSelected() {
  const app = selectedApp.value
  const folder = selectedFolder.value
  const previous = app ? desktop.shortcuts.titles[app.id] ?? app.title : folder?.name ?? ""
  closeContextMenu()
  dialog.value = { visible: true, mode: "input", title: "重命名", message: "请输入此项目的新名称：", initialValue: previous, action: "rename", appId: app?.id ?? "", folderId: folder?.id ?? "" }
}
function deleteSelected() {
  const appId = contextMenu.value?.appId ?? ""
  const folderId = contextMenu.value?.folderId ?? ""
  closeContextMenu()
  dialog.value = { visible: true, mode: "confirm", title: "确认删除", message: "确定要将此项目移到回收站吗？", initialValue: "", action: "delete", appId, folderId }
}
function createDesktopFolder() {
  closeContextMenu()
  dialog.value = { visible: true, mode: "input", title: "新建文件夹", message: "请输入文件夹名称：", initialValue: "新建文件夹", action: "new-folder", appId: "", folderId: "" }
}
function createDesktopShortcut() { closeContextMenu(); shortcutPickerVisible.value = true }
function applyDesktopShortcut(appId: string) { try { desktop.createShortcut(appId) } catch (error) { showActionError(error) } }
function showProperties() {
  const app = selectedApp.value
  const folder = selectedFolder.value
  const message = app
    ? `${desktop.shortcuts.titles[app.id] ?? app.title}\nWindows XP 桌面快捷方式\n${app.description}`
    : folder
      ? `${folder.name}\n文件夹\n位置：我的电脑\\C:\\桌面`
      : "Windows XP 桌面\n本地模拟系统\n此桌面上的文件和设置保存在此浏览器中。"
  closeContextMenu()
  dialog.value = { visible: true, mode: "message", title: "属性", message, initialValue: "", action: "properties", appId: "", folderId: "" }
}
function refreshDesktop() { desktop.selectedId = null; desktop.selectedIds = []; closeContextMenu() }
function sortDesktop(mode: "manual" | "name" | "type") { desktop.setSortMode(mode); closeContextMenu() }
function resetDesktopLayout() { desktop.resetIconLayout(); closeContextMenu() }
function toggleIconSize() {
  const size = preferences.iconSize === "large" ? "small" : "large"
  desktop.iconSize = size
  preferences.setIconSize(size)
  closeContextMenu()
}
function onDocumentKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    closeContextMenu()
    if (dialog.value.visible) dialog.value.visible = false
  } else if (event.altKey && event.key === "F4" && windows.activeWindowId) {
    event.preventDefault()
    windows.close(windows.activeWindowId)
  }
}
function isTextEntry(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
}
function onDesktopKeyDown(event: KeyboardEvent) {
  if (isTextEntry(event.target)) return
  if (event.key === "Enter" && (event.target as HTMLElement).closest(".desktop-icon")) {
    const icon = (event.target as HTMLElement).closest<HTMLElement>(".desktop-icon")
    const id = icon?.dataset.iconId
    if (id) {
      event.preventDefault()
      const app = sortedApps.value.find((item) => item.id === id)
      if (app) launchApp(app.launchAppId ?? app.id)
      else if (filesystem.entryById(id)?.kind === "folder") launchApp("computer", id)
    }
  } else if (event.key === "F2" && desktop.selectedIds.length === 1) {
    const id = desktop.selectedIds[0]
    const app = sortedApps.value.find((item) => item.id === id)
    if ((app && !app.system) || filesystem.entryById(id)) {
      event.preventDefault()
      contextMenu.value = { x: 0, y: 0, ...(app ? { appId: id } : { folderId: id }) }
      renameSelected()
    }
  } else if (event.key === "Delete" && desktop.selectedIds.length) {
    event.preventDefault()
    if (desktop.selectedIds.length === 1) {
      const id = desktop.selectedIds[0]
      const app = sortedApps.value.find((item) => item.id === id)
      const folder = filesystem.entryById(id)
      if (app || folder) {
        dialog.value = { visible: true, mode: "confirm", title: "确认删除", message: "确定要将此项目移到回收站吗？", initialValue: "", action: "delete", appId: app?.id ?? "", folderId: folder?.id ?? "" }
        return
      }
    }
    desktop.selectedIds.forEach((id) => {
      if (sortedApps.value.some((app) => app.id === id)) {
        try { desktop.removeShortcut(id) } catch { /* Protected system shortcuts stay on the desktop. */ }
      } else if (filesystem.entryById(id)) filesystem.moveToRecycleBin(id)
    })
    desktop.selectedIds = []
    desktop.selectedId = null
  } else if (event.ctrlKey && event.key.toLowerCase() === "a") {
    event.preventDefault()
    desktop.selectedIds = [...sortedApps.value.map((app) => app.id), ...desktopFolders.value.map((folder) => folder.id)]
  }
}
function beginMarquee(event: PointerEvent) {
  if (props.mobile || event.button !== 0 || (event.target as HTMLElement).closest(".desktop-icon, .xp-window, .xp-taskbar, .xp-context-menu")) return
  const root = event.currentTarget as HTMLElement
  const bounds = root.getBoundingClientRect()
  const x = event.clientX - bounds.left
  const y = event.clientY - bounds.top
  selectionStart.value = { x, y, clientX: event.clientX, clientY: event.clientY }
  desktop.selectedId = null
  desktop.selectedIds = []
  windows.activeWindowId = null
  ;(root as HTMLElement).setPointerCapture(event.pointerId)
}
function updateMarquee(event: PointerEvent) {
  const start = selectionStart.value
  if (!start) return
  const root = document.getElementById("desktop-shell")
  if (!root) return
  const bounds = root.getBoundingClientRect()
  const x = event.clientX - bounds.left
  const y = event.clientY - bounds.top
  const rect = { left: Math.min(start.x, x), top: Math.min(start.y, y), width: Math.abs(x - start.x), height: Math.abs(y - start.y) }
  if (rect.width < 4 && rect.height < 4) return
  selectionBox.value = rect
  const selectionClientRect = { left: Math.min(start.clientX, event.clientX), right: Math.max(start.clientX, event.clientX), top: Math.min(start.clientY, event.clientY), bottom: Math.max(start.clientY, event.clientY) }
  desktop.selectedIds = Array.from(root.querySelectorAll<HTMLElement>(".desktop-icon")).filter((icon) => {
    const iconRect = icon.getBoundingClientRect()
    return iconRect.left < selectionClientRect.right && iconRect.right > selectionClientRect.left && iconRect.top < selectionClientRect.bottom && iconRect.bottom > selectionClientRect.top
  }).map((icon) => icon.dataset.iconId!).filter(Boolean)
}
function endMarquee() { selectionStart.value = null; selectionBox.value = null }
function applyDialog(value: string) {
  try {
    if (dialog.value.action === "rename") {
      if (dialog.value.appId) desktop.renameShortcut(dialog.value.appId, value)
      else if (dialog.value.folderId) filesystem.rename(dialog.value.folderId, value)
    } else if (dialog.value.action === "new-folder") {
      const name = value.trim()
      if (!name) throw new Error("请输入文件夹名称。")
      filesystem.createFolder("desktop-folder", name)
    } else if (dialog.value.action === "delete") {
      if (dialog.value.appId) desktop.removeShortcut(dialog.value.appId)
      else if (dialog.value.folderId) filesystem.moveToRecycleBin(dialog.value.folderId)
      desktop.selectedIds = desktop.selectedIds.filter((id) => id !== dialog.value.appId && id !== dialog.value.folderId)
      desktop.selectedId = desktop.selectedIds[0] ?? null
    }
  } catch (error) {
    dialog.value = { ...dialog.value, visible: true, mode: "message", title: "无法完成操作", message: error instanceof Error ? error.message : "操作失败。", action: "error" }
  }
}
function showActionError(error: unknown) {
  dialog.value = { visible: true, mode: "message", title: "无法完成操作", message: error instanceof Error ? error.message : "操作失败。", initialValue: "", action: "error", appId: "", folderId: "" }
}
function launchApp(appId: string, folderId?: string) {
  desktop.recordRecentApp(appId)
  windows.open(appId, folderId)
}
function onDocumentClick(event: MouseEvent) {
  if (!(event.target as HTMLElement).closest(".xp-context-menu")) closeContextMenu()
}
function requestPower() { power.openDialog() }
function requestLogoff() {
  power.closeDialog()
  power.setStatus("logged-off")
  windows.windows = []
  windows.activeWindowId = null
  void router.replace({ name: "password" })
}

onMounted(() => {
  document.addEventListener("keydown", onDocumentKeyDown)
  document.addEventListener("click", onDocumentClick)
  window.addEventListener("resize", windows.resizeForViewport, { passive: true })
  if (audio.value) audio.value.volume = preferences.soundVolume
  if (preferences.soundEnabled) play(audio.value)
})
onBeforeUnmount(() => {
  document.removeEventListener("keydown", onDocumentKeyDown)
  document.removeEventListener("click", onDocumentClick)
  window.removeEventListener("resize", windows.resizeForViewport)
})
</script>

<template>
  <div id="desktop-shell" class="xp-desktop" :class="desktopClass" :style="{ backgroundImage: `url(${wallpaper})` }" @contextmenu.prevent="handleBlankContextMenu" @pointerdown="beginMarquee" @pointermove="updateMarquee" @pointerup="endMarquee" @pointercancel="endMarquee" @click.self="refreshDesktop" @keydown="onDesktopKeyDown" tabindex="0">
    <IconGroup :mobile="mobile" :apps="sortedApps" :folders="desktopFolders" :positions="desktop.shortcuts.iconPositions" :manual-layout="desktop.shortcuts.sortMode === 'manual'" :selected-ids="desktop.selectedIds" :recycle-count="recycleCount" @select="(id) => { desktop.selectedId = id; desktop.selectedIds = id ? [id] : [] }" @move-icon="desktop.setIconPosition" @open-app="launchApp" @open-folder="launchApp('computer', $event)" @context-icon="handleIconContextMenu" />
    <TransitionGroup v-if="!mobile" name="xp-window-transition">
      <AppWindow v-for="window in windows.visibleWindows" :key="window.id" :window="window" :mobile="false" />
    </TransitionGroup>
    <Transition v-else name="xp-window-transition">
      <AppWindow v-if="windows.activeWindow && windows.activeWindow.state !== 'minimized'" :key="windows.activeWindow.id" :window="windows.activeWindow" :mobile="true" />
    </Transition>
    <DesktopContextMenu v-if="contextMenu" :x="contextMenu.x" :y="contextMenu.y" :app="selectedApp" :folder="!!selectedFolder" @open="openSelected" @refresh="refreshDesktop" @sort="sortDesktop" @reset-layout="resetDesktopLayout" @view="toggleIconSize" @new-folder="createDesktopFolder" @new-shortcut="createDesktopShortcut" @rename="renameSelected" @delete="deleteSelected" @properties="showProperties" />
    <DesktopActionDialog v-model="dialog.visible" :title="dialog.title" :message="dialog.message" :mode="dialog.mode" :initial-value="dialog.initialValue" @confirm="applyDialog" />
    <ShortcutPickerDialog v-model="shortcutPickerVisible" @confirm="applyDesktopShortcut" />
    <div v-if="selectionBox" class="xp-selection-marquee" :style="{ left: `${selectionBox.left}px`, top: `${selectionBox.top}px`, width: `${selectionBox.width}px`, height: `${selectionBox.height}px` }"></div>
    <Taskbar @launch="launchApp" @power="requestPower" @logoff="requestLogoff" />
    <audio ref="audio" :src="LoginAudio" preload="auto"></audio>
  </div>
</template>
