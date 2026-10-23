<script lang="ts" setup>
import DeskBg from "@/assets/deskbg.jpg"
import DesktopBackground from "@/assets/desktopBackground.jpg"
import { usePreferencesStore, type ThemeColor, type WallpaperId } from "@/store/preferencesStore"

const preferences = usePreferencesStore()
const wallpapers: { id: WallpaperId; name: string; image: string }[] = [
  { id: "deskbg", name: "Windows XP Bliss", image: DeskBg },
  { id: "desktop-background", name: "桌面背景", image: DesktopBackground },
]
const themes: { id: ThemeColor; name: string }[] = [
  { id: "blue", name: "蓝色（默认）" },
  { id: "olive", name: "橄榄绿" },
  { id: "silver", name: "银色" },
]
</script>

<template>
  <main class="xp-properties-app">
    <header><h1>显示 属性</h1><p>选择桌面外观。更改会立即应用并保存在本地。</p></header>
    <section class="xp-properties-section">
      <h2>桌面背景</h2>
      <div class="xp-wallpaper-options">
        <button v-for="wallpaper in wallpapers" :key="wallpaper.id" :class="{ selected: preferences.wallpaperId === wallpaper.id }" :aria-pressed="preferences.wallpaperId === wallpaper.id" @click="preferences.setWallpaper(wallpaper.id)">
          <img :src="wallpaper.image" :alt="wallpaper.name" /><span>{{ wallpaper.name }}</span>
        </button>
      </div>
    </section>
    <section class="xp-properties-section xp-properties-row">
      <label for="xp-theme">颜色方案</label>
      <select id="xp-theme" :value="preferences.themeColor" @change="preferences.setThemeColor(($event.target as HTMLSelectElement).value as ThemeColor)">
        <option v-for="theme in themes" :key="theme.id" :value="theme.id">{{ theme.name }}</option>
      </select>
    </section>
    <section class="xp-properties-section xp-properties-row">
      <label for="xp-icon-size">桌面图标大小</label>
      <select id="xp-icon-size" :value="preferences.iconSize" @change="preferences.setIconSize(($event.target as HTMLSelectElement).value as 'large' | 'small')">
        <option value="large">大图标</option><option value="small">小图标</option>
      </select>
    </section>
    <footer>应用到桌面和系统窗口</footer>
  </main>
</template>
