<script lang="ts" setup>
import { ref } from "vue"
import DesktopActionDialog from "@/components/desktop/DesktopActionDialog.vue"
import { createLocalBackup, restoreLocalBackup, validateLocalBackup, type LocalBackup } from "@/mocks/backup"
import { useDesktopStore } from "@/store/desktopStore"
import { useFilesystemStore } from "@/store/filesystemStore"
import { usePreferencesStore } from "@/store/preferencesStore"
import { useSystemStore } from "@/store/systemStore"
import { useWindowStore } from "@/store/windowStore"

const windows = useWindowStore()
const filesystem = useFilesystemStore()
const desktop = useDesktopStore()
const preferences = usePreferencesStore()
const system = useSystemStore()
const fileInput = ref<HTMLInputElement>()
const statusMessage = ref("")
const pendingBackup = ref<LocalBackup | null>(null)
const confirmRestore = ref(false)
const categories = [
  { id: "display-properties", icon: "🖥️", title: "外观和主题", description: "更改桌面背景、颜色和图标大小。" },
  { id: "sound-properties", icon: "🔊", title: "声音、语音和音频设备", description: "调整系统音效和播放音量。" },
]

function exportBackup() {
  try {
    const backup = createLocalBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `windows-xp-local-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    statusMessage.value = "备份文件已导出。"
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : "导出失败。"
  }
}

async function inspectBackup(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ""
  if (!file) return
  try {
    pendingBackup.value = validateLocalBackup(JSON.parse(await file.text()))
    confirmRestore.value = true
    statusMessage.value = ""
  } catch (error) {
    pendingBackup.value = null
    statusMessage.value = error instanceof Error ? error.message : "备份文件无效。"
  }
}

function applyRestore() {
  if (!pendingBackup.value) return
  try {
    restoreLocalBackup(pendingBackup.value)
    filesystem.refresh()
    desktop.reload()
    preferences.reload()
    system.reload()
    pendingBackup.value = null
    statusMessage.value = "本地数据已恢复。"
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : "恢复失败。"
  }
}
</script>

<template>
  <main class="xp-control-panel">
    <header><h1>选择一个类别</h1><p>调整 Windows XP 本地模拟系统的设置。</p></header>
    <section class="xp-control-categories">
      <button v-for="category in categories" :key="category.id" @click="windows.open(category.id)">
        <span class="xp-control-category-icon">{{ category.icon }}</span>
        <span><b>{{ category.title }}</b><small>{{ category.description }}</small></span>
        <span class="xp-control-arrow">›</span>
      </button>
    </section>
    <section class="xp-control-backup" aria-labelledby="xp-backup-title">
      <div><h2 id="xp-backup-title">本地数据备份</h2><p>将文件、桌面布局、浏览器和外观设置导出为 JSON，或从本机备份文件恢复。</p></div>
      <div class="xp-control-backup-actions">
        <button @click="exportBackup">导出本地备份</button>
        <button @click="fileInput?.click()">从文件导入</button>
        <input ref="fileInput" type="file" accept="application/json,.json" aria-label="选择本地备份文件" @change="inspectBackup" />
      </div>
      <p v-if="statusMessage" class="xp-control-backup-status" role="status">{{ statusMessage }}</p>
    </section>
    <footer>所有更改保存在此浏览器的本地设置中。</footer>
    <DesktopActionDialog v-model="confirmRestore" title="恢复本地数据" mode="confirm" message="恢复备份将替换此浏览器中的文件、桌面和设置。是否继续？" confirm-text="恢复" @confirm="applyRestore" />
  </main>
</template>
