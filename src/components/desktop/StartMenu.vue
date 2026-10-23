<script lang="ts" setup>
import { computed, ref } from "vue"
import { desktopApps } from "@/apps/manifest"
import Avatar from "@/assets/avatar.jpg"

const emit = defineEmits<{ (event: "launch", appId: string): void; (event: "power"): void }>()
const query = ref("")
const filteredApps = computed(() => {
  const text = query.value.trim().toLocaleLowerCase()
  return desktopApps.filter((app) => !text || app.title.toLocaleLowerCase().includes(text) || app.description.toLocaleLowerCase().includes(text))
})

function launch(appId: string) {
  query.value = ""
  emit("launch", appId)
}
</script>

<template>
  <section class="xp-start-menu" aria-label="开始菜单" @click.stop>
    <header class="xp-start-user"><img :src="Avatar" alt="" /><b>韩振方</b></header>
    <div class="xp-start-columns">
      <div class="xp-start-pinned">
        <button v-for="app in filteredApps.slice(0, 4)" :key="app.id" class="xp-start-app" @click="launch(app.id)"><img :src="app.icon" /><span>{{ app.title }}</span></button>
        <label class="xp-start-search"><span>搜索程序</span><input v-model="query" placeholder="输入程序名称" @keydown.enter="filteredApps[0] && launch(filteredApps[0].id)" /></label>
      </div>
      <div class="xp-start-all-programs">
        <strong>所有程序</strong>
        <button v-for="app in filteredApps" :key="app.id" class="xp-start-app" @click="launch(app.id)"><img :src="app.icon" /><span>{{ app.title }}</span></button>
        <p v-if="!filteredApps.length" class="xp-start-no-results">没有找到程序</p>
      </div>
    </div>
    <footer class="xp-start-bottom"><span>Windows XP</span><button @click="emit('power')">关闭计算机</button></footer>
  </section>
</template>
