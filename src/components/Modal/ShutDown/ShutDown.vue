<script lang="ts" setup>
import { ref, computed, nextTick } from "vue"
import { useRootStore } from "@/store/rootStore"
import { storeToRefs } from "pinia"

import { showDownIconGroup } from "@/pages/DeskTop/IconGroup/iconGroup"

import type { CSSProperties } from "vue"

const props = defineProps<{ closeModal?: () => void }>()

const rootStore = useRootStore()
const { isMobile } = storeToRefs(rootStore)

const modalWrapper = ref<HTMLDivElement>()
const LEFT_OFFSET = ref<number>()
const TOP_OFFSET = ref<number>()

const modalWrapperStyle = computed<CSSProperties>(() => {
  return {
    position: "absolute",
    top: `calc(30% - ${TOP_OFFSET.value}px)`,
    left: `calc(50% - ${LEFT_OFFSET.value}px)`,
    zIndex: 9999,
  }
})

nextTick(() => {
  TOP_OFFSET.value = modalWrapper.value!.offsetHeight / 2
  LEFT_OFFSET.value = modalWrapper.value!.offsetWidth / 2
})
</script>
<template>
  <div
    ref="modalWrapper"
    @click.stop=""
    class="h-30% border-1px border-black"
    :class="isMobile ? `w-60%` : `w-30% max-w-50rem `"
    :style="modalWrapperStyle"
  >
    <div class="w-full h-full flex flex-col">
      <div
        class="w-full h-20% bg-#061B83 flex justify-between items-center px-5%"
      >
        <span class="text-2rem font-200">关闭计算机</span>
        <img class="w-10% h-full object-contain" src="@/assets/windowsXP.png" />
      </div>

      <div
        class="w-full grow flex px-10% bg-#7F9AEF border-y-2px border-white"
      >
        <div
          v-for="item in showDownIconGroup"
          class="flex flex-1 flex-col items-center justify-center"
        >
          <img :class="isMobile ? `w-3rem` : `w-5rem`" :src="item.icon" />
          <span class="mt-1rem">{{ item.name }}</span>
        </div>
      </div>

      <div class="w-full h-20% bg-#061B83 flex items-center px-5%">
        <div
          @click="closeModal"
          class="w-5rem h-2rem bg-white rounded-4px text-center ml-auto hover:cursor-pointer"
        >
          <span class="text-black font-400 leading-2rem">取消</span>
        </div>
      </div>
    </div>
  </div>
</template>
