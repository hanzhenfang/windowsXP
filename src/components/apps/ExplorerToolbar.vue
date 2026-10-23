<script lang="ts" setup>
export interface ExplorerBreadcrumb { id: string; name: string }

defineProps<{
  breadcrumbs: ExplorerBreadcrumb[]
  canBack: boolean
  canForward: boolean
  view: "icons" | "details"
}>()

const emit = defineEmits<{
  (event: "back"): void
  (event: "forward"): void
  (event: "up"): void
  (event: "navigate", id: string): void
  (event: "refresh"): void
  (event: "view", mode: "icons" | "details"): void
  (event: "new-folder"): void
}>()
</script>

<template>
  <div class="xp-explorer-toolbar">
    <div class="xp-explorer-nav">
      <button aria-label="后退" :disabled="!canBack" @click="emit('back')">◀</button>
      <button aria-label="前进" :disabled="!canForward" @click="emit('forward')">▶</button>
      <button aria-label="向上" :disabled="breadcrumbs.length < 2" @click="emit('up')">⬆</button>
      <button aria-label="刷新" @click="emit('refresh')">⟳</button>
      <button aria-label="新建文件夹" @click="emit('new-folder')">📁+</button>
      <span>地址(D)</span>
      <nav aria-label="当前位置" class="xp-explorer-address">
        <button v-for="(crumb, index) in breadcrumbs" :key="crumb.id" :class="{ current: index === breadcrumbs.length - 1 }" @click="emit('navigate', crumb.id)">
          <span v-if="index" aria-hidden="true">›</span>{{ crumb.name }}
        </button>
      </nav>
      <div class="xp-explorer-view-toggle">
        <button aria-label="图标视图" :class="{ active: view === 'icons' }" @click="emit('view', 'icons')">▦</button>
        <button aria-label="详细信息视图" :class="{ active: view === 'details' }" @click="emit('view', 'details')">☷</button>
      </div>
    </div>
  </div>
</template>
