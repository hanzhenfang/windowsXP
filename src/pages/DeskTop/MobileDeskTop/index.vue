<script lang="ts" setup>
import { onMounted, ref } from "vue"
import IconGroup from "@/pages/DeskTop/IconGroup/index.vue"
import Footer from "@/pages/DeskTop/Footer/index.vue"
import AppWindow from "@/components/Window/AppWindow.vue"
import { useWindowStore } from "@/store/windowStore"
import { useSystemAudio } from "@/composables/useSystemAudio"
import DeskBg from "@/assets/deskbg.jpg"
import LoginAudio from "@/assets/audio/login.mp3"

const store = useWindowStore()
const audio = ref<HTMLAudioElement>()
const { play } = useSystemAudio()
onMounted(() => play(audio.value))
</script>

<template>
  <div class="xp-desktop xp-mobile-desktop" :style="{ backgroundImage: `url(${DeskBg})` }">
    <IconGroup mobile />
    <Transition name="xp-window-transition">
      <AppWindow v-if="store.activeWindow && !store.activeWindow.minimized" :key="store.activeWindow.id" :window="store.activeWindow" :mobile="true" />
    </Transition>
    <Footer />
    <audio ref="audio" :src="LoginAudio" preload="auto"></audio>
  </div>
</template>
