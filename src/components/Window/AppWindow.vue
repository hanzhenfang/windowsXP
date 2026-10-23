<script lang="ts" setup>
import { computed, ref } from "vue"
import { useWindowStore, type AppWindow as WindowState } from "@/store/windowStore"
import { getDesktopApp } from "@/apps/manifest"

const props = defineProps<{ window: WindowState; mobile: boolean }>()
const store = useWindowStore()
const dragging = ref(false)
const dragOrigin = ref({ x: 0, y: 0, left: 0, top: 0 })
const app = computed(() => getDesktopApp(props.window.appId))
const style = computed(() => props.mobile
  ? { zIndex: props.window.zIndex }
  : { zIndex: props.window.zIndex, left: `${props.window.x}px`, top: `${props.window.y}px`, width: `${props.window.width}px`, height: `${props.window.height}px` })

function beginDrag(event: PointerEvent) {
  if (props.mobile || props.window.maximized || (event.target as HTMLElement).closest("button")) return
  dragging.value = true
  dragOrigin.value = { x: event.clientX, y: event.clientY, left: props.window.x, top: props.window.y }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function moveDrag(event: PointerEvent) {
  if (!dragging.value) return
  store.moveWindow(props.window.id, Math.max(0, dragOrigin.value.left + event.clientX - dragOrigin.value.x), Math.max(0, dragOrigin.value.top + event.clientY - dragOrigin.value.y))
}
</script>

<template>
  <section class="xp-window" :class="{ 'xp-window-mobile': mobile, 'xp-window-maximized': window.maximized }" :style="style" @pointerdown="store.focusWindow(window.id)">
    <header class="xp-titlebar" @pointerdown="beginDrag" @pointermove="moveDrag" @pointerup="dragging = false" @pointercancel="dragging = false" @dblclick="!mobile && store.toggleMaximize(window.id)">
      <div class="xp-window-title"><img :src="window.icon" /><span>{{ window.title }}</span></div>
      <div class="xp-window-controls">
        <button v-if="!mobile" aria-label="最小化" @click.stop="store.minimizeWindow(window.id)">_</button>
        <button v-if="!mobile" aria-label="最大化" @click.stop="store.toggleMaximize(window.id)">□</button>
        <button aria-label="关闭" class="xp-close" @click.stop="store.closeWindow(window.id)">×</button>
      </div>
    </header>
    <div class="xp-window-toolbar"><span>文件(F)</span><span>编辑(E)</span><span>查看(V)</span><span>收藏(A)</span><span>工具(T)</span><span>帮助(H)</span></div>
    <div class="xp-window-content">
      <template v-if="window.appId === 'computer'">
        <h2>存储在这台计算机上的文件</h2>
        <div class="xp-drive-grid"><div><span>💾</span><b>本地磁盘 (C:)</b><small>系统磁盘</small></div><div><span>💿</span><b>DVD 驱动器 (D:)</b><small>光盘驱动器</small></div></div>
        <h2>其他位置</h2><p>控制面板　　我的文档　　共享文档</p>
      </template>
      <template v-else-if="window.appId === 'recycle'"><div class="xp-empty">🗑️<p>{{ app?.description }}</p></div></template>
      <template v-else-if="window.appId === 'network'"><h2>网络任务</h2><p>查看网络连接、设置家庭或小型办公网络。</p><div class="xp-network-card">🌐　局域网或高速 Internet</div></template>
    </div>
    <footer class="xp-window-status">对象: {{ window.appId === 'computer' ? '2' : '0' }}</footer>
  </section>
</template>
