<script lang="ts" setup>
import { RouterView } from "vue-router"
import PowerOverlay from "@/components/desktop/PowerOverlay.vue"
</script>
<template>
  <div class="w-screen h-screen overflow-hidden">
    <RouterView />
    <PowerOverlay />
  </div>
</template>
