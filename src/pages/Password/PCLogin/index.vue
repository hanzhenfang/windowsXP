<script lang="ts" setup>
import {
  ref,
  reactive,
  computed,
  watch,
  nextTick,
  onBeforeUnmount,
  CSSProperties,
  Ref,
} from "vue"
import { useRouter } from "vue-router"

import { sleep } from "@/utils/sleep"

const props = defineProps<{
  shutDownModal: Ref<boolean>
}>()

const router = useRouter()

const wrapper = ref<HTMLDivElement>()
const avatarBox = ref<HTMLDivElement>()

const isHover = ref<boolean>(false)
const isMouseDown = ref<boolean>(false) // check user mouse is downing.
const isUnlockSuccess = ref<boolean>(false)

const canSlide = ref<boolean>(false)
const avatarBoxOffsetHeight = ref<number>(92)
const avatarBoxOffsetWidth = ref<number>(0)
const wrapperOffsetWidth = ref<number>(0)
const avatarSwiperRect = reactive({
  startClientX: 0,
  offsetLeft: 0, // key point: the distance between wrapper'left and StartClientX
})

const wrapperStyle = computed<CSSProperties>(() => {
  return {
    height: isHover.value ? `9.5rem` : `12rem`,
    width: isHover.value ? `70%` : `80%`,
    padding: isHover.value ? `0` : `1rem`,
    display: `flex`,
    alignItems: `center`,
    boxShadow: isHover.value
      ? `1px 1px 5px 1px #4b5cc4`
      : `0px 1px 8px 1px rgba(255,255,255,0.2)`,
    transition: `all 1s `,
    border: `2px solid #44cef6`,
    borderRadius: `1rem`,
  }
})

const avatarBoxStyle = computed<CSSProperties>(() => {
  return {
    height: `fit-content`,
    border: isHover.value ? `1px solid black` : `0.5px solid white`,
    borderRadius: `1rem`,
    boxShadow: isHover.value ? `` : `1px 1px 10px 2px black`,
    transition: `all 1s,`,
    overflow: `hidden`,
  }
})

//tips: ready to slide, collect current coordinate info.
function collectSlideData() {
  avatarBoxOffsetWidth.value = avatarBox.value?.offsetWidth ?? 0 //99
  wrapperOffsetWidth.value = wrapper.value?.offsetWidth ?? 0 //405
}

function onMouseEnterAvatar() {
  if (props.shutDownModal.value) return
  if (isUnlockSuccess.value) return
  isHover.value = true
}

function onMouseLeaveAvatar() {
  if (isMouseDown.value) return
  isHover.value = false
}

function onMouseUp() {
  isHover.value = false
  isMouseDown.value = false
}

function onMouseDown(e: PointerEvent) {
  if (e.pointerType === "mouse" && e.button !== 0) return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  isHover.value = true
  isMouseDown.value = true

  avatarSwiperRect.startClientX = e.clientX
  avatarSwiperRect.offsetLeft = e.offsetX
}

function onMouseMove(e: PointerEvent) {
  if (!canSlide.value || !isMouseDown.value) return
  e.preventDefault()
  //tips: in some cases, user mouse may move out the avatar scope,that will cause avatarbox move error.
  document.onpointermove = function (e) {
    e.preventDefault()
    const _MAX__OFFSET_DISTANCE =
      wrapperOffsetWidth.value - avatarBoxOffsetWidth.value - 3
    const { clientX } = e
    let _offset_X = clientX - avatarSwiperRect.startClientX
    if (_offset_X < 0) return
    if (_offset_X > _MAX__OFFSET_DISTANCE) _offset_X = _MAX__OFFSET_DISTANCE
    avatarBox.value!.style.transform = `translateX(${_offset_X}px)`
    if (_offset_X === _MAX__OFFSET_DISTANCE) {
      isUnlockSuccess.value = true
      router.push({ name: "desktop" })
    }
  }

  //tips: init the avatarbox position when user mouse up.
  document.onpointerup = function () {
    initAvatarState()
  }
}

function initAvatarState() {
  isMouseDown.value = false
  isHover.value = false
  canSlide.value = false
  document.onmousemove = () => {}
  document.onpointermove = null
  document.onpointerup = null
  if (!!avatarBox.value) avatarBox.value!.style.transform = `translateX(0px)`
}

watch(isHover, async (newValue, oldValue) => {
  if (!newValue || !isHover.value) {
    // if mouse leave the avator box, init the position.
    initAvatarState()
    return
  } // if mouse move out,noting to do
  await sleep(1000)
  if (!isHover.value) return
  collectSlideData()
  canSlide.value = true
})

nextTick(() => {
  avatarBoxOffsetHeight.value = avatarBox.value!.offsetHeight
})

onBeforeUnmount(() => {
  initAvatarState()
})
</script>
<template>
  <div class="w-full h-full flex items-center">
    <div ref="wrapper" :style="wrapperStyle">
      <div
        ref="avatarBox"
        :style="avatarBoxStyle"
        class="h-fit border-white rounded-1rem overflow-hidden bg-red cursor-pointer"
        @mouseenter.stop="onMouseEnterAvatar"
        @pointerdown="onMouseDown"
        @pointermove="onMouseMove"
        @mouseleave="onMouseLeaveAvatar"
        @pointerup="onMouseUp"
        @pointercancel="onMouseUp"
      >
        <img
          class="block h-9rem object-contain"
          src="@/assets/avatar.jpg"
          draggable="false"
        />
      </div>

      <div
        class="ml-4rem skew-x--20"
        :style="[
          isHover ? { opacity: 0 } : { opacity: 1 },
          { transition: `all 1s` },
        ]"
      >
        <span class="text-3rem font-600">向右拖拽解锁屏幕</span>
      </div>
    </div>
  </div>
</template>
