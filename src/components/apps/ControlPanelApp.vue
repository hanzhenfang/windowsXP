<script lang="ts" setup>
import { useWindowStore } from "@/store/windowStore"

const windows = useWindowStore()
const categories = [
  { id: "display-properties", icon: "🖥️", title: "外观和主题", description: "更改桌面背景、颜色和图标大小。" },
  { id: "sound-properties", icon: "🔊", title: "声音、语音和音频设备", description: "调整系统音效和播放音量。" },
]
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
    <footer>所有更改保存在此浏览器的本地设置中。</footer>
  </main>
</template>
