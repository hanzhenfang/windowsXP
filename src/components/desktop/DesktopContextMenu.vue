<script lang="ts" setup>
import type { DesktopApp } from "@/apps/manifest"

defineProps<{
  x: number
  y: number
  app?: DesktopApp
  folder?: boolean
}>()

const emit = defineEmits<{
  (event: "open"): void
  (event: "refresh"): void
  (event: "sort"): void
  (event: "view"): void
  (event: "new-folder"): void
  (event: "rename"): void
  (event: "delete"): void
  (event: "properties"): void
}>()
</script>

<template>
  <div class="xp-context-menu" :style="{ left: `${x}px`, top: `${y}px` }" @click.stop>
    <template v-if="app || folder">
      <button @click="emit('open')">打开(O)</button>
      <hr />
      <button :disabled="app?.system" @click="emit('rename')">重命名(M)</button>
      <button :disabled="app?.system" @click="emit('delete')">删除(D)</button>
      <hr />
      <button @click="emit('properties')">属性(R)</button>
    </template>
    <template v-else>
      <button @click="emit('view')">查看(V)　›</button>
      <button @click="emit('sort')">排列图标方式(O)　›</button>
      <button @click="emit('refresh')">刷新(E)</button>
      <hr />
      <button @click="emit('new-folder')">新建文件夹(W)</button>
      <hr />
      <button @click="emit('properties')">属性(R)</button>
    </template>
  </div>
</template>
