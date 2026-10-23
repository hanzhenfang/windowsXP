<script lang="ts" setup>
import { ref, watch, onMounted, nextTick, onBeforeUnmount } from "vue"
import { useRouter } from "vue-router"

import IconCombination from "@/components/IconCombination/index.vue"

//some options constants
let timerID: number
let printTimerID: number
let loadingTimerID: number
const welcomText: string =
  "恭喜你打开了一个非常 cool 的应用，WindowXP，这也是我偶然迸发的一个 idea ，如果你觉得有意思，不如和我一起完成这个作品吧！～" // will automatic printing when user first enter the page
const cursorFlickerFrequency: number = 200 //control the cursor flicker frequency
const printTextPageDuration: number = 22200 // control the duration of printing "some words page"
const printSpeed: number = 300 // control the speed of printing word, (one word)/(printSpeed)
const loadingDuration: number = 5000 // control the duration of loadingPage
// *********************************************

const router = useRouter()
const textAreas = ref<HTMLSpanElement>()
const flicker = ref<boolean>(false)
const isFlicker = ref<boolean>(true)
const isLoading = ref<boolean>(false)

//tips: if user opens the system first time, make the cursor flicker.
function turnOnSystem() {
  const _startPrintTime = Date.now()
  timerID = window.setInterval(() => {
    const _printPageTime = Date.now()
    if (_printPageTime - _startPrintTime > printTextPageDuration) {
      clearInterval(timerID)
      isFlicker.value = false //cursor stop flicker
      isLoading.value = true //progress bar start loading
      return
    } else {
      flicker.value = !flicker.value
    }
  }, cursorFlickerFrequency)
}

//tips: automatic printing welcome words.
function autoPrintText(text: string) {
  let _str = ""
  let _index = 0
  printTimerID = window.setInterval(() => {
    if (!textAreas.value) return
    if (_index > text.length - 1) {
      clearInterval(printTimerID)
      return
    }
    _str = _str + text.substring(_index, _index + 1)
    textAreas.value!.innerText = _str
    _index++
  }, printSpeed)
}

//tips: read to password page
function stopTheLoadingPage() {
  if (isLoading.value === false) return
  let _startLoadingTime = Date.now()
  loadingTimerID = window.setInterval(() => {
    const _loadingPageTime = Date.now()
    if (_loadingPageTime - _startLoadingTime > loadingDuration) {
      clearInterval(loadingTimerID)
      isLoading.value = false
      router.replace({ name: "password" })
    }
  })
}

watch(isLoading, stopTheLoadingPage)

onMounted(() => {
  turnOnSystem()
})

nextTick(() => {
  autoPrintText(welcomText)
})

onBeforeUnmount(() => {
  if (!!timerID) clearInterval(timerID)
  if (!!printTimerID) clearInterval(printTimerID)
  if (!!loadingTimerID) clearInterval(loadingTimerID)
})
</script>
<template>
  <div class="w-full h-full bg-black">
    <div v-if="isFlicker" class="w-full h-full">
      <div class="text-box w-fit">
        <span ref="textAreas" class="text-1.8rem font-600"></span>
      </div>

      <!-- <div
        class="w-1.5rem h-2.2rem border-white"
        :class="flicker ? `border-b-0.3rem` : ``"
      ></div> -->
    </div>

    <Transition name="loading">
      <div
        v-if="isLoading"
        class="w-full h-full pt-10% pb-2% flex flex-col items-center justify-between"
      >
        <IconCombination />

        <!-- Progress bar content -->
        <div
          class="w-18rem h-2rem border-#7FBCDF border-0.25rem rounded-0.3rem flex items-center overflow-hidden"
        >
          <div
            v-for="item in 5"
            :class="[1, 5].includes(item) ? `bg-blue` : `bg-white`"
            class="progress w-1rem h-1.3rem rounded-0.1rem mr-0.1rem translate-x--5rem"
          ></div>
        </div>

        <!-- footer content -->
        <div class="w-full flex justify-between items-baseline p-x-4%">
          <span class="font-800 text-1rem leading-4.2rem">
            Follow® HanZhenFang JueJin
          </span>
          <span class="font-600 text-3rem leading-">Microsoft</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.text-box::after {
  display: inline-block;
  content: "";
  width: 2rem;
  vertical-align: text-bottom;
  border-bottom: 3px solid white;
  margin-left: 8px;
  animation: flicker 0.5s linear infinite;
}

@keyframes flicker {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.loading-enter-from {
  opacity: 0;
}
.loading-enter-to {
  opacity: 1;
}

.loading-enter-active {
  transition: opacity 2s ease-in;
}

@keyframes progress {
  from {
    transform: translateX(-5rem);
  }
  to {
    transform: translateX(18rem);
  }
}
.progress {
  animation: progress 1.3s linear infinite 2s;
}
</style>
