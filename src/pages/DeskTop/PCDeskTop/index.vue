<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from "vue"
import { desktopApps } from "@/apps/manifest"
import IconGroup from "@/pages/DeskTop/IconGroup/index.vue"
import Footer from "@/pages/DeskTop/Footer/index.vue"
import AppWindow from "@/components/Window/AppWindow.vue"
import { useWindowStore } from "@/store/windowStore"
import { useSystemAudio } from "@/composables/useSystemAudio"
import DeskBg from "@/assets/deskbg.jpg"
import LoginAudio from "@/assets/audio/login.mp3"

const store = useWindowStore()
const audio = ref<HTMLAudioElement>()
const { play } = useSystemAudio()
const contextMenu = ref<{ x: number; y: number } | null>(null)
const isNewMenuOpen = ref(false)
function handleContextMenu(event: MouseEvent) {
  const desktop = document.getElementById("PCDesktop")
  if (!desktop?.contains(event.target as Node)) return
  event.preventDefault()
  if ((event.target as HTMLElement).closest(".desktop-icon, .xp-window, .xp-context-menu")) return
  const bounds = desktop.getBoundingClientRect()
  contextMenu.value = { x: Math.max(0, Math.min(event.clientX - bounds.left, bounds.width - 190)), y: Math.max(0, Math.min(event.clientY - bounds.top, bounds.height - 225)) }
  isNewMenuOpen.value = false
}
function closeContextMenu() { contextMenu.value = null; isNewMenuOpen.value = false }
function createShortcut(appId: string) { store.createShortcut(appId); closeContextMenu() }
onMounted(() => {
  document.addEventListener("contextmenu", handleContextMenu)
  play(audio.value)
})
onBeforeUnmount(() => document.removeEventListener("contextmenu", handleContextMenu))
</script>

<template>
  <div id="PCDesktop" class="xp-desktop" :style="{ backgroundImage: store.wallpaper === 'bliss' ? `url(${DeskBg})` : 'none', backgroundColor: store.wallpaper === 'bliss' ? undefined : '#3a6ea5' }" @pointerdown.self="store.activeWindowId = null" @click="closeContextMenu">
    <IconGroup />
    <TransitionGroup name="xp-window-transition">
      <AppWindow v-for="window in store.visibleWindows" :key="window.id" :window="window" :mobile="false" />
    </TransitionGroup>
    <div v-if="contextMenu" class="xp-context-menu" :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }" @click.stop>
      <button @click="store.toggleIconLayout(); closeContextMenu()">查看：{{ store.iconLayout === 'list' ? '网格' : '列表' }}</button>
      <button @click="store.toggleIconSort(); closeContextMenu()">排序方式：{{ store.iconSort === 'default' ? '原始顺序' : store.iconSort === 'name' ? '名称' : '类型' }}</button>
      <button @click="store.refreshDesktop(); closeContextMenu()">刷新(E)</button>
      <hr />
      <button :disabled="!store.clipboardAppId" @click="store.pasteShortcut(); closeContextMenu()">粘贴快捷方式(P)</button>
      <div class="xp-new-menu-wrap">
        <button @click="isNewMenuOpen = !isNewMenuOpen">新建快捷方式(W)　›</button>
        <div v-if="isNewMenuOpen" class="xp-context-submenu">
          <button v-for="app in desktopApps" :key="app.id" @click="createShortcut(app.id)">{{ app.title }} 快捷方式</button>
        </div>
      </div>
      <hr />
      <button @click="closeContextMenu(); store.openApp('settings')">个性化(R)</button>
    </div>
    <Footer />
    <audio ref="audio" :src="LoginAudio" preload="auto"></audio>
  </div>
</template>
