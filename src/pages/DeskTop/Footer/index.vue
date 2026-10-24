<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { useRootStore } from "@/store/rootStore"
import { useWindowStore } from "@/store/windowStore"
import { desktopApps } from "@/apps/manifest"
import WindowsLogo from "@/assets/windowsXP.png"
import ShieldIcon from "@/assets/systemIcon/安全卫士.ico"
import NetworkIcon from "@/assets/systemIcon/网络邻居.ico"
import ShutDownModal from "@/components/Modal/ShutDown/ShutDown.vue"
import type { PowerAction } from "@/components/Modal/ShutDown/types"

const rootStore = useRootStore()
const windows = useWindowStore()
const router = useRouter()
const nowTime = ref(new Date())
const isStartOpen = ref(false)
const startMenuView = ref<"pinned" | "recent" | "all">("pinned")
const searchQuery = ref("")
const startApps = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  let ids = startMenuView.value === "pinned" ? windows.pinnedApps : startMenuView.value === "recent" ? windows.recentApps : desktopApps.map((app) => app.id)
  const apps = query ? desktopApps : desktopApps.filter((app) => ids.includes(app.id))
  return apps.filter((app) => !query || app.title.toLocaleLowerCase().includes(query))
})
const isPowerDialogOpen = ref(false)
const systemMode = ref<"running" | "standby" | "shutdown">("running")
const previewWindowId = ref<string | null>(null)
const isMobile = computed(() => rootStore.isMobile)
const timeText = computed(() => nowTime.value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
let timer = 0
onMounted(() => { timer = window.setInterval(() => { nowTime.value = new Date() }, 1000) })
onBeforeUnmount(() => window.clearInterval(timer))
function handleGlobalKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  const isEditing = !!target?.closest("input, textarea, select, [contenteditable='true']")
  if (event.key === "Escape") {
    if (isPowerDialogOpen.value) isPowerDialogOpen.value = false
    else if (isStartOpen.value) closeStartMenu()
    else if (systemMode.value === "standby") resume()
    return
  }
  if (!isEditing && (event.key === "Meta" || event.key === "OS")) {
    event.preventDefault()
    isStartOpen.value = !isStartOpen.value
    startMenuView.value = "pinned"
    searchQuery.value = ""
  }
  if (!isEditing && event.altKey && event.key === "Tab") {
    event.preventDefault()
    windows.cycleWindow()
  }
}
function handleOutsidePointerDown(event: PointerEvent) {
  if (!isStartOpen.value) return
  const target = event.target as HTMLElement | null
  if (target?.closest(".xp-start-menu, .xp-start-button")) return
  closeStartMenu()
}
onMounted(() => window.addEventListener("keydown", handleGlobalKeydown))
onBeforeUnmount(() => window.removeEventListener("keydown", handleGlobalKeydown))
onMounted(() => document.addEventListener("pointerdown", handleOutsidePointerDown))
onBeforeUnmount(() => document.removeEventListener("pointerdown", handleOutsidePointerDown))

function openFromStart(id: string) {
  windows.openApp(id)
  closeStartMenu()
}
function closeStartMenu() {
  isStartOpen.value = false
  startMenuView.value = "pinned"
  searchQuery.value = ""
}
function executePower(action: PowerAction) {
  isPowerDialogOpen.value = false
  if (action === "restart") {
    windows.clearSession()
    router.replace({ name: "loading" })
    return
  }
  systemMode.value = action === "shutdown" ? "shutdown" : "standby"
}
function resume() { systemMode.value = "running" }
function logOff() {
  closeStartMenu()
  windows.clearSession()
  router.replace({ name: "password" })
}
function lockSession() {
  closeStartMenu()
  router.replace({ name: "password" })
}
</script>

<template>
  <div class="xp-taskbar" :class="{ 'xp-taskbar-mobile': isMobile }">
      <div v-if="isStartOpen" class="xp-start-menu">
        <div class="xp-start-user"><img src="@/assets/avatar.jpg" alt="" /><b>韩振方</b></div>
        <label class="xp-start-search"><span>搜索程序</span><input v-model="searchQuery" type="search" placeholder="输入应用名称" /></label>
        <nav class="xp-start-tabs" aria-label="开始菜单分类"><button :class="{ active: startMenuView === 'pinned' && !searchQuery }" @click="startMenuView = 'pinned'">已固定</button><button :class="{ active: startMenuView === 'recent' && !searchQuery }" @click="startMenuView = 'recent'">最近使用</button></nav>
        <div class="xp-start-apps">
          <div v-for="app in startApps" :key="app.id" class="xp-start-app-entry"><button class="xp-start-app-open" @click="openFromStart(app.id)"><img :src="app.icon" alt="" /><span>{{ app.title }}</span></button><button class="xp-start-pin" :aria-pressed="windows.pinnedApps.includes(app.id)" :title="windows.pinnedApps.includes(app.id) ? '取消固定' : '固定到开始菜单'" @click="windows.togglePinnedApp(app.id)">{{ windows.pinnedApps.includes(app.id) ? '★' : '☆' }}</button></div>
          <p v-if="!startApps.length" class="xp-start-empty">{{ startMenuView === 'recent' && !searchQuery ? '最近还没有打开的程序。' : '没有找到匹配的程序。' }}</p>
        </div>
        <div class="xp-start-bottom">
          <button class="xp-all-programs" :aria-expanded="startMenuView === 'all'" @click="startMenuView = startMenuView === 'all' ? 'pinned' : 'all'">{{ startMenuView === 'all' ? '返回　‹' : '所有程序　›' }}</button>
          <button @click="lockSession">锁定</button>
          <button @click="logOff">注销</button>
          <button class="xp-power-open" @click="closeStartMenu(); isPowerDialogOpen = true">关闭计算机</button>
        </div>
      </div>
    <button class="xp-start-button" :class="{ active: isStartOpen }" :aria-expanded="isStartOpen" @click.stop="isStartOpen = !isStartOpen; startMenuView = 'pinned'; searchQuery = ''"><img :src="WindowsLogo" alt="" /><span>开始</span></button>
    <div class="xp-task-items">
      <button v-for="item in windows.windows" :key="item.id" :title="item.title" :aria-label="`${item.title}${item.minimized ? '，已最小化' : ''}`" :class="{ active: windows.activeWindowId === item.id && !item.minimized }" @mouseenter="previewWindowId = item.id" @mouseleave="previewWindowId = null" @focus="previewWindowId = item.id" @blur="previewWindowId = null" @click="item.minimized || windows.activeWindowId !== item.id ? windows.focusWindow(item.id) : windows.minimizeWindow(item.id)"><span v-if="previewWindowId === item.id" class="xp-task-preview"><img :src="item.icon" alt="" /><b>{{ item.title }}</b><small>{{ item.minimized ? '已最小化' : '正在运行' }}</small></span><img :src="item.icon" alt="" /><span>{{ item.title }}</span></button>
    </div>
    <div class="xp-tray"><img :src="ShieldIcon" alt="安全中心" /><img :src="NetworkIcon" alt="网络状态" /><time>{{ timeText }}</time></div>

    <ShutDownModal v-if="isPowerDialogOpen" :mobile="isMobile" :close-modal="() => isPowerDialogOpen = false" :on-action="executePower" />
    <div v-if="systemMode !== 'running'" class="xp-system-state" :class="{ 'xp-system-standby': systemMode === 'standby' }" role="dialog" aria-modal="true">
      <template v-if="systemMode === 'shutdown'">
        <div class="xp-off-logo">Windows<span>XP</span></div>
        <h1>现在可以安全地关闭计算机</h1>
        <p>这是 Windows XP 桌面的关机模拟界面。</p>
        <button @click="executePower('restart')">重新启动</button>
      </template>
      <button v-else class="xp-wake-button" @click="resume">计算机正在待机<br /><small>点击此处唤醒</small></button>
    </div>
  </div>
</template>
