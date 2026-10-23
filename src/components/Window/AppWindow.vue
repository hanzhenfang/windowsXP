<script lang="ts" setup>
import { computed, ref } from "vue"
import { useWindowStore, type AppWindow as WindowState } from "@/store/windowStore"
import ExplorerApp from "@/components/apps/ExplorerApp.vue"
import RecycleBinApp from "@/components/apps/RecycleBinApp.vue"
import NetworkPlacesApp from "@/components/apps/NetworkPlacesApp.vue"
import NetworkConnectionsApp from "@/components/apps/NetworkConnectionsApp.vue"

const props = defineProps<{ window: WindowState; mobile: boolean }>()
const store = useWindowStore()
const dragging = ref(false)
const dragOrigin = ref({ x: 0, y: 0, left: 0, top: 0 })
const resizing = ref(false)
const resizeOrigin = ref({ x: 0, y: 0, left: 0, top: 0, width: 0, height: 0, direction: "" })
const style = computed(() => props.mobile
  ? { zIndex: props.window.zIndex }
  : { zIndex: props.window.zIndex, left: `${props.window.x}px`, top: `${props.window.y}px`, width: `${props.window.width}px`, height: `${props.window.height}px` })

function beginDrag(event: PointerEvent) {
  if (props.mobile || props.window.state === "maximized" || (event.target as HTMLElement).closest("button")) return
  dragging.value = true
  dragOrigin.value = { x: event.clientX, y: event.clientY, left: props.window.x, top: props.window.y }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function moveDrag(event: PointerEvent) {
  if (!dragging.value) return
  store.move(props.window.id, dragOrigin.value.left + event.clientX - dragOrigin.value.x, dragOrigin.value.top + event.clientY - dragOrigin.value.y)
}
function beginResize(event: PointerEvent, direction: string) {
  if (props.mobile || props.window.state !== "normal") return
  event.preventDefault()
  event.stopPropagation()
  resizing.value = true
  resizeOrigin.value = { x: event.clientX, y: event.clientY, left: props.window.x, top: props.window.y, width: props.window.width, height: props.window.height, direction }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function moveResize(event: PointerEvent) {
  if (!resizing.value) return
  const start = resizeOrigin.value
  const dx = event.clientX - start.x
  const dy = event.clientY - start.y
  let left = start.left
  let top = start.top
  let width = start.width
  let height = start.height
  if (start.direction.includes("e")) width += dx
  if (start.direction.includes("s")) height += dy
  if (start.direction.includes("w")) { left += dx; width -= dx }
  if (start.direction.includes("n")) { top += dy; height -= dy }
  store.move(props.window.id, left, top)
  store.resize(props.window.id, width, height)
}
function endResize() { resizing.value = false }
function toggleFromTitle(event: MouseEvent) {
  if (props.mobile || (event.target as HTMLElement).closest("button")) return
  store.toggleMaximize(props.window.id)
}
</script>

<template>
  <section class="xp-window" :class="{ 'xp-window-mobile': mobile, 'xp-window-maximized': window.state === 'maximized' }" :style="style" @pointerdown="store.focus(window.id)">
    <header class="xp-titlebar" @pointerdown="beginDrag" @pointermove="moveDrag" @pointerup="dragging = false" @pointercancel="dragging = false" @dblclick="toggleFromTitle">
      <div class="xp-window-title"><img :src="window.icon" /><span>{{ window.title }}</span></div>
      <div class="xp-window-controls">
        <button v-if="!mobile" aria-label="最小化" @click.stop="store.minimize(window.id)">_</button>
        <button v-if="!mobile" :aria-label="window.state === 'maximized' ? '还原' : '最大化'" @click.stop="store.toggleMaximize(window.id)">{{ window.state === 'maximized' ? '❐' : '□' }}</button>
        <button aria-label="关闭" class="xp-close" @click.stop="store.close(window.id)">×</button>
      </div>
    </header>
    <div v-if="window.appId !== 'computer'" class="xp-window-toolbar"><span>文件(F)</span><span>编辑(E)</span><span>查看(V)</span><span>收藏(A)</span><span>工具(T)</span><span>帮助(H)</span></div>
    <div class="xp-window-content" :class="{ 'xp-explorer-window-content': window.appId === 'computer', 'xp-recycle-window-content': window.appId === 'recycle' }">
      <template v-if="window.appId === 'computer'">
        <ExplorerApp :initial-folder-id="window.initialFolderId" />
      </template>
      <template v-else-if="window.appId === 'recycle'"><RecycleBinApp /></template>
      <template v-else-if="window.appId === 'network'"><NetworkPlacesApp /></template>
      <template v-else-if="window.appId === 'network-connections'"><NetworkConnectionsApp /></template>
      <template v-else-if="window.appId === 'browser'"><div class="xp-browser-placeholder"><div>🌐</div><h2>Internet Explorer</h2><p>浏览器将在本地打开模拟页面，不会连接外网。</p><button @click="store.close(window.id)">关闭窗口</button></div></template>
      <template v-else-if="window.appId === 'blog'"><div class="xp-browser-placeholder"><h2>韩振方的个人主页</h2><p>本地示例主页</p><p>文章内容将在个人博客模块中补齐。</p></div></template>
    </div>
    <footer v-if="window.appId !== 'computer' && window.appId !== 'recycle'" class="xp-window-status">对象: 0</footer>
    <template v-if="!mobile && window.state === 'normal'">
      <div v-for="direction in ['n','s','e','w','ne','nw','se','sw']" :key="direction" class="xp-resize-handle" :class="`xp-resize-${direction}`" @pointerdown="beginResize($event, direction)" @pointermove="moveResize" @pointerup="endResize" @pointercancel="endResize"></div>
    </template>
  </section>
</template>
