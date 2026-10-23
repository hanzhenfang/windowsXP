<script lang="ts" setup>
import { ref } from "vue"
import LoginAudio from "@/assets/audio/login.mp3"
import { usePreferencesStore } from "@/store/preferencesStore"
import { useSystemAudio } from "@/composables/useSystemAudio"

const preferences = usePreferencesStore()
const { play } = useSystemAudio()
const previewAudio = ref<HTMLAudioElement>()
function previewSound() {
  if (!previewAudio.value) return
  previewAudio.value.volume = preferences.soundVolume
  play(previewAudio.value)
}
</script>

<template>
  <main class="xp-properties-app xp-sound-properties">
    <header><h1>声音和音频设备 属性</h1><p>管理本地模拟系统的提示音。</p></header>
    <section class="xp-properties-section xp-sound-toggle">
      <label><input type="checkbox" :checked="preferences.soundEnabled" @change="preferences.setSoundEnabled(($event.target as HTMLInputElement).checked)" /> 启用 Windows 系统音效</label>
      <button :disabled="!preferences.soundEnabled" @click="previewSound">▶ 试听登录音效</button>
      <audio ref="previewAudio" :src="LoginAudio" preload="none"></audio>
    </section>
    <section class="xp-properties-section xp-volume-control">
      <label for="xp-volume">音量：{{ Math.round(preferences.soundVolume * 100) }}%</label>
      <input id="xp-volume" type="range" min="0" max="100" :value="Math.round(preferences.soundVolume * 100)" :disabled="!preferences.soundEnabled" @input="preferences.setSoundVolume(Number(($event.target as HTMLInputElement).value) / 100)" />
      <div class="xp-volume-labels"><span>低</span><span>高</span></div>
    </section>
    <footer>使用项目内置的本地登录音效，不播放在线音频。</footer>
  </main>
</template>
