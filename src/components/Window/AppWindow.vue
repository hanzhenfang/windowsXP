<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useWindowStore, type AppWindow as WindowState } from "@/store/windowStore"
import { getDesktopApp } from "@/apps/manifest"
import DeskBg from "@/assets/deskbg.jpg"

const props = defineProps<{ window: WindowState; mobile: boolean }>()
const store = useWindowStore()
const element = ref<HTMLElement>()
const dragging = ref(false)
const dragMoved = ref(false)
const dragOrigin = ref({ x: 0, y: 0, left: 0, top: 0 })
const titleDraft = ref("")
const openMenu = ref<string | null>(null)
const showAbout = ref(false)
const browserAddress = ref(props.window.browserUrl ?? "https://www.juejin.cn/")
const online = ref(typeof navigator === "undefined" ? true : navigator.onLine)
const app = computed(() => getDesktopApp(props.window.appId))
const propertyTargetId = computed(() => props.window.targetId ?? props.window.appId.slice("properties:".length))
const propertiesApp = computed(() => props.window.appId.startsWith("properties:") ? getDesktopApp(props.window.appId.slice("properties:".length)) : undefined)
const propertyTitle = computed(() => store.customTitles[propertyTargetId.value] ?? (propertiesApp.value && store.customTitles[propertiesApp.value.id]) ?? propertiesApp.value?.title ?? "")
const style = computed(() => props.mobile
  ? { zIndex: props.window.zIndex }
  : { zIndex: props.window.zIndex, left: `${props.window.x}px`, top: `${props.window.y}px`, width: `${props.window.width}px`, height: `${props.window.height}px` })

watch(propertyTitle, (title) => { titleDraft.value = title }, { immediate: true })
watch(() => props.window.browserUrl, (url) => { if (url) browserAddress.value = url })

function beginDrag(event: PointerEvent) {
  if (props.mobile || props.window.maximized || (event.target as HTMLElement).closest("button")) return
  dragging.value = true
  dragMoved.value = false
  dragOrigin.value = { x: event.clientX, y: event.clientY, left: props.window.x, top: props.window.y }
  try { (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId) } catch { dragging.value = false }
}
function moveDrag(event: PointerEvent) {
  if (!dragging.value) return
  if (Math.abs(event.clientX - dragOrigin.value.x) > 4 || Math.abs(event.clientY - dragOrigin.value.y) > 4) dragMoved.value = true
  store.moveWindow(props.window.id, dragOrigin.value.left + event.clientX - dragOrigin.value.x, dragOrigin.value.top + event.clientY - dragOrigin.value.y)
}
function endDrag() {
  if (dragging.value && dragMoved.value && !props.mobile && !props.window.maximized) {
    if (props.window.y <= 2) store.toggleMaximize(props.window.id)
    else if (props.window.x <= 2) store.snapWindow(props.window.id, "left")
    else if (props.window.x + props.window.width >= window.innerWidth - 2) store.snapWindow(props.window.id, "right")
  }
  dragging.value = false
}
function applyResize() {
  if (!props.mobile && element.value && !props.window.maximized) {
    const bounds = element.value.getBoundingClientRect()
    store.resizeWindow(props.window.id, bounds.width, bounds.height)
  }
}
let resizeObserver: ResizeObserver | undefined
function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    openMenu.value = null
    showAbout.value = false
  }
}
onMounted(() => {
  if (!props.mobile && element.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(applyResize)
    resizeObserver.observe(element.value)
  }
  window.addEventListener("online", handleConnectionChange)
  window.addEventListener("offline", handleConnectionChange)
  window.addEventListener("keydown", handleWindowKeydown)
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener("online", handleConnectionChange)
  window.removeEventListener("offline", handleConnectionChange)
  window.removeEventListener("keydown", handleWindowKeydown)
})
function handleConnectionChange() { online.value = navigator.onLine }
function checkConnection() { online.value = navigator.onLine }

function applyProperties(close = false) {
  store.setCustomTitle(propertyTargetId.value, titleDraft.value)
  if (close) store.closeWindow(props.window.id)
}
function openExternal() {
  const input = props.window.appId === "browser" ? browserAddress.value : app.value?.externalUrl
  if (!input) return
  try {
    const url = new URL(input)
    if (url.protocol !== "http:" && url.protocol !== "https:") return
    if (props.window.appId === "browser") store.setBrowserUrl(props.window.id, url.href)
    window.open(url.href, "_blank", "noopener,noreferrer")
  } catch { /* invalid address remains in the field for correction */ }
}
function toolbarAction(action: string) {
  openMenu.value = null
  if (action === "close") store.closeWindow(props.window.id)
  if (action === "minimize") store.minimizeWindow(props.window.id)
  if (action === "maximize") store.toggleMaximize(props.window.id)
  if (action === "about") showAbout.value = true
}
function toggleMenu(name: string) { openMenu.value = openMenu.value === name ? null : name }
function openProperties() {
  store.openProperties(propertiesApp.value?.id ?? props.window.appId, propertiesApp.value ? propertyTargetId.value : undefined)
  openMenu.value = null
}
</script>

<template>
  <section ref="element" class="xp-window" :class="{ 'xp-window-mobile': mobile, 'xp-window-maximized': window.maximized }" :style="style" @pointerdown="store.focusWindow(window.id)" @click="openMenu = null">
    <header class="xp-titlebar" @pointerdown="beginDrag" @pointermove="moveDrag" @pointerup="endDrag" @pointercancel="endDrag" @lostpointercapture="endDrag" @dblclick="!mobile && store.toggleMaximize(window.id)">
      <div class="xp-window-title"><img :src="window.icon" :alt="window.title" /><span>{{ window.title }}</span></div>
      <div class="xp-window-controls">
        <button v-if="!mobile" aria-label="最小化" @click.stop="store.minimizeWindow(window.id)">_</button>
        <button v-if="!mobile" :aria-label="window.maximized ? '还原' : '最大化'" @click.stop="store.toggleMaximize(window.id)">{{ window.maximized ? '❐' : '□' }}</button>
        <button aria-label="关闭" class="xp-close" @click.stop="store.closeWindow(window.id)">×</button>
      </div>
    </header>
    <nav class="xp-window-toolbar" aria-label="窗口菜单" @pointerdown.stop="store.focusWindow(window.id)">
      <div v-for="menu in ['文件(F)', '编辑(E)', '查看(V)', '工具(T)', '帮助(H)']" :key="menu" class="xp-toolbar-menu">
        <button type="button" :aria-expanded="openMenu === menu" @click.stop="toggleMenu(menu)">{{ menu }}</button>
        <div v-if="openMenu === menu" class="xp-toolbar-popup" @click.stop>
          <template v-if="menu.startsWith('文件')">
            <button @click="toolbarAction('minimize')">最小化</button><button @click="toolbarAction('maximize')">{{ window.maximized ? '还原' : '最大化' }}</button><button @click="toolbarAction('close')">关闭</button>
          </template>
          <template v-else-if="menu.startsWith('查看')">
            <button @click="toolbarAction('maximize')">{{ window.maximized ? '还原窗口' : '最大化窗口' }}</button><button @click="store.refreshDesktop(); openMenu = null">刷新</button>
          </template>
          <template v-else-if="menu.startsWith('工具')">
            <button @click="openProperties">属性</button>
          </template>
          <template v-else-if="menu.startsWith('帮助')">
            <button @click="showAbout = true; openMenu = null">关于 Windows XP 桌面</button>
          </template>
          <template v-else>
            <button disabled>当前窗口没有可编辑内容</button>
          </template>
        </div>
      </div>
    </nav>

    <div class="xp-window-content">
      <template v-if="propertiesApp">
        <div class="xp-properties">
          <img :src="propertiesApp.icon" :alt="propertiesApp.title" />
          <label>名称：<input v-model="titleDraft" maxlength="40" /></label>
          <label>类型：<input value="Windows XP 桌面快捷方式" readonly /></label>
          <label>位置：<input :value="window.targetId?.includes('-shortcut-') ? '桌面快捷方式' : '桌面'" readonly /></label>
          <label>描述：<input :value="propertiesApp.description" readonly /></label>
          <div class="xp-properties-actions"><button @click="applyProperties(true)">确定</button><button @click="store.closeWindow(window.id)">取消</button><button @click="applyProperties()">应用</button></div>
        </div>
      </template>
      <template v-else-if="window.appId === 'computer'">
        <div class="xp-app-nav"><button :class="{ active: window.computerLocation === 'drives' }" @click="store.setComputerLocation(window.id, 'drives')">我的电脑</button><button :class="{ active: window.computerLocation === 'documents' }" @click="store.setComputerLocation(window.id, 'documents')">我的文档</button><button :class="{ active: window.computerLocation === 'control-panel' }" @click="store.setComputerLocation(window.id, 'control-panel')">控制面板</button></div>
        <template v-if="window.computerLocation === 'drives'">
          <h2>存储在这台计算机上的文件</h2><div class="xp-drive-grid"><button @click="store.setComputerLocation(window.id, 'c-drive')"><span>💾</span><b>本地磁盘 (C:)</b><small>演示磁盘</small></button><button @click="store.setComputerLocation(window.id, 'd-drive')"><span>💿</span><b>DVD 驱动器 (D:)</b><small>光盘驱动器</small></button></div>
          <h2>其他位置</h2><p>控制面板　　我的文档　　共享文档</p>
        </template>
        <template v-else-if="window.computerLocation === 'c-drive' || window.computerLocation === 'd-drive'"><div class="xp-app-nav"><button @click="store.setComputerLocation(window.id, 'drives')">← 我的电脑</button><b>{{ window.computerLocation === 'c-drive' ? '本地磁盘 (C:)' : 'DVD 驱动器 (D:)' }}</b></div><h2>此位置为空</h2><p>这是浏览器演示空间，不会读取电脑上的真实磁盘或文件。</p></template>
        <template v-else-if="window.computerLocation === 'documents'"><h2>我的文档</h2><p>这是本地演示空间，不会读取电脑上的真实文件。</p><div v-for="item in store.restoredItems" :key="item" class="xp-network-card">📄　{{ item }}</div></template>
        <template v-else><h2>控制面板</h2><p>桌面个性化　　显示设置　　用户账户</p><div class="xp-network-card">这些设置在浏览器演示中以桌面偏好保存。</div></template>
      </template>
      <template v-else-if="window.appId === 'recycle'">
        <div class="xp-recycle-toolbar"><span>{{ store.recycleItems.length }} 个对象</span><button :disabled="store.recycleItems.length === 0" @click="store.emptyRecycle">清空回收站</button></div>
        <div v-if="store.recycleItems.length" class="xp-recycle-list"><div v-for="item in store.recycleItems" :key="item">📄　{{ item }}<button @click="store.restoreRecycleItem(item)">还原</button></div></div>
        <div v-else class="xp-empty">🗑️<p>回收站为空</p></div>
      </template>
      <template v-else-if="window.appId === 'network'"><h2>网络任务</h2><p>查看网络连接、设置家庭或小型办公网络。</p><div class="xp-network-card">{{ online ? '🌐　网络已连接' : '⚠️　当前离线' }}<small>　网络邻居内容为演示数据</small></div><button class="xp-app-action" @click="checkConnection">重新检测连接</button></template>
      <template v-else-if="window.appId === 'browser'"><h2>Internet Explorer</h2><p>输入网址后会在新标签页打开外部网站。</p><form class="xp-browser-launcher" @submit.prevent="openExternal"><label for="xp-browser-address">地址</label><input id="xp-browser-address" v-model="browserAddress" type="url" placeholder="https://example.com" /><button type="submit">打开</button></form><p class="xp-browser-note">打开外部链接会离开此演示窗口。</p></template>
      <template v-else-if="window.appId === 'blog'"><div class="xp-blog-card"><img :src="window.icon" alt="" /><div><h2>个人博客</h2><p>{{ app?.description }}</p><button class="xp-app-action" @click="openExternal">在新标签页打开掘金主页</button></div></div></template>
      <template v-else-if="window.appId === 'settings'"><h2>外观和个性化</h2><p>选择桌面背景。设置会保存在此浏览器中。</p><div class="xp-wallpaper-options"><button :class="{ active: store.wallpaper === 'bliss' }" @click="store.setWallpaper('bliss')"><span class="wallpaper-preview" :style="{ backgroundImage: `url(${DeskBg})` }"></span><b>草地</b></button><button :class="{ active: store.wallpaper === 'blue' }" @click="store.setWallpaper('blue')"><span class="wallpaper-preview wallpaper-blue"></span><b>经典蓝</b></button></div><h2>演示信息</h2><p>外部网站会在新标签页打开；电源选项只在页面内模拟。</p></template>
      <template v-else><div class="xp-empty">Windows XP<p>此应用目前没有可显示的内容。</p></div></template>
      <div v-if="showAbout" class="xp-about-backdrop" @click.self="showAbout = false"><section role="dialog" aria-modal="true"><h2>关于 Windows XP 桌面</h2><p>一个在浏览器中运行的 Windows XP 风格交互演示。</p><button @click="showAbout = false">确定</button></section></div>
    </div>
    <footer class="xp-window-status">{{ propertiesApp ? '快捷方式属性' : `${window.title} · 本地演示` }}</footer>
  </section>
</template>
