<script lang="ts" setup>
import { ref } from "vue"

const menuItemsGroup = [
  {
    name: "查看(V)",
    arrow: true,
    textColor: "black",
    action: () => {
      console.log("查看")
    },
  },
  {
    name: "排序方式(O)",
    arrow: false,
    textColor: "black",
    action: () => {
      console.log("刷新")
    },
  },
  {
    name: "刷新(E)",
    arrow: false,
    textColor: "black",
    action: () => {
      console.log("刷新")
    },
  },
  {
    name: "粘贴(P)",
    arrow: false,
    textColor: "#848587",
    action: () => {
      console.log("刷新")
    },
  },
  {
    name: "粘贴快捷方式(S)",
    arrow: false,
    textColor: "#848587",
    action: () => {
      console.log("刷新")
    },
  },
  {
    name: "新建(W)",
    textColor: "black",
    arrow: false,
    action: () => {
      console.log("刷新")
    },
  },
  {
    name: "个性化(R)",
    textColor: "black",
    arrow: false,
    action: () => {
      console.log("刷新")
    },
  },
]
</script>
<template>
  <div
    class="w-17rem bg-#ECECEC flex flex-col py-0.5rem shadow-[4px_4px_5px_2px_rgba(0,0,0,0.3)]"
  >
    <div
      v-for="(item, i) in menuItemsGroup"
      :key="i"
      @click="item.action"
      class="w-full h-2.5rem px-3rem text-1.5rem leading-2.5rem hover:bg-white mb-0.3rem"
      :class="[3, 5, 6].includes(i) ? `b-t-1px b-gray` : `static`"
      :style="{ color: `${item.textColor}` }"
    >
      <span>{{ item.name }}</span>
    </div>
  </div>
</template>
