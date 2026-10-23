<script lang="ts" setup>
import type { MockEntry } from "@/mocks/filesystem/types"

defineProps<{ entry: MockEntry; selected: boolean; view: "icons" | "details" }>()
const emit = defineEmits<{
  (event: "select", eventObject: MouseEvent): void
  (event: "open"): void
  (event: "context", eventObject: MouseEvent): void
}>()

function iconFor(entry: MockEntry) {
  if (entry.kind === "folder") return entry.id === "drive-d" ? "💿" : entry.type === "drive" ? "💽" : "📁"
  if (entry.type.startsWith("image/")) return "🖼️"
  if (entry.type.startsWith("audio/")) return "🎵"
  if (entry.type === "text/x-url-shortcut") return "🌐"
  return "📄"
}
function formatSize(size: number) {
  if (!size) return "—"
  if (size < 1024) return `${size} 字节`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(timestamp)
}
</script>

<template>
  <button class="xp-file-item" :class="[`xp-file-${view}`, { selected }]" :data-file-id="entry.id" @click.stop="emit('select', $event)" @dblclick.stop="emit('open')" @contextmenu.stop.prevent="emit('context', $event)">
    <span class="xp-file-icon" aria-hidden="true">{{ iconFor(entry) }}</span>
    <span class="xp-file-name" :title="entry.name">{{ entry.name }}</span>
    <span v-if="view === 'details'" class="xp-file-type">{{ entry.kind === 'folder' ? '文件夹' : entry.type }}</span>
    <span v-if="view === 'details'" class="xp-file-size">{{ entry.kind === 'folder' ? '—' : formatSize(entry.size) }}</span>
    <span v-if="view === 'details'" class="xp-file-date">{{ formatDate(entry.modifiedAt) }}</span>
  </button>
</template>
