<script lang="ts" setup>
import { ref, computed, CSSProperties } from "vue"

import { useRootStore } from "@/store/rootStore"
import { storeToRefs } from "pinia"

const props = withDefaults(
  defineProps<{ companySize?: number; winSize?: number; compact?: boolean }>(),
  {
    companySize: 3,
    winSize: 7, //then main property of this component
  }
)

const rootStore = useRootStore()
const { isMobile } = storeToRefs(rootStore)

const winSpan = ref<HTMLSpanElement>()
const companySpan = ref<HTMLSpanElement>()

const iconBoxWidth = computed(() => {
  const winSpanWidth = winSpan.value?.offsetWidth!
  return winSpanWidth + 8
})

const winStyle = computed<CSSProperties>(() => {
  const _fontSize = props.winSize
  return {
    fontSize: `clamp(${isMobile.value ? 2.2 : 3.5}rem, ${isMobile.value ? 12 : 6}vw, ${_fontSize}rem)`,
    lineHeight: `0.72`,
  }
})

const companyStyle = computed<CSSProperties>(() => {
  const _fontSize = props.companySize
  return {
    fontSize: `clamp(${isMobile.value ? 1.2 : 1.6}rem, ${isMobile.value ? 4.8 : 2.6}vw, ${_fontSize}rem)`,
  }
})

const xpStyle = computed<CSSProperties>(() => {
  const _fontSize = props.winSize
  return {
    position: "absolute",
    fontSize: `clamp(${isMobile.value ? 1.2 : 1.8}rem, ${isMobile.value ? 5 : 3}vw, ${_fontSize / 2}rem)`,
    bottom: `clamp(.2rem, 1vw, ${_fontSize / 4}rem)`,
    color: "red",
    fontWeight: 800,
  }
})
</script>
<template>
  <div
    class="xp-logo w-full flex flex-col items-center"
    :class="{ 'xp-logo-compact': compact }"
  >
    <div
      class="xp-logo-icon flex h-full justify-center"
    >
      <div class="self-end basis-40%">
        <span ref="companySpan" :style="companyStyle"> Microsoft </span>
      </div>

      <div class="self-end overflow-hidden">
        <img class="w-full object-contain" src="@/assets/WindowsXP.ico" />
      </div>
    </div>

    <div class="relative">
      <span ref="winSpan" class="text-white font-800" :style="winStyle">
        Windows
      </span>
      <span :style="xpStyle">XP</span>
    </div>
  </div>
</template>

<style scoped>
.xp-logo { min-width: 0; max-width: 100%; }
.xp-logo-icon { width: min(100%, 48rem); min-height: 0; }
.xp-logo-compact .xp-logo-icon { width: 100%; height: clamp(6rem, 16vh, 11rem); }
.xp-logo-compact .xp-logo-icon img { width: auto; max-width: 100%; max-height: 100%; }
.xp-logo-icon > div { min-width: 0; }
.xp-logo-icon img { max-height: min(30vh, 32rem); }
.xp-logo > div:last-child { position: relative; max-width: 100%; white-space: nowrap; }
.xp-logo > div:last-child > span:first-child { display: block; line-height: .78; }
.xp-logo > div:last-child > span:last-child { left: calc(100% - .2rem); right: auto; }
@media (max-width: 760px), (max-height: 520px) {
  .xp-logo-icon { width: min(72vw, 30rem); height: min(22vh, 20rem); }
  .xp-logo-icon img { max-height: 100%; }
  .xp-logo > div:last-child > span:first-child { line-height: .8; }
}
</style>
