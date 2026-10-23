<script lang="ts" setup>
import { computed, ref } from "vue"
import { useSystemStore } from "@/store/systemStore"
import { useWindowStore } from "@/store/windowStore"

const system = useSystemStore()
const windows = useWindowStore()
const selectedComputerId = ref<string | null>(null)
const selectedShareId = ref<string | null>(null)
const selectedFileId = ref<string | null>(null)
const selectedComputer = computed(() => system.sharedComputers.find((computer) => computer.id === selectedComputerId.value))
const selectedShare = computed(() => selectedComputer.value?.shares.find((share) => share.id === selectedShareId.value))
const selectedFile = computed(() => selectedShare.value?.files.find((file) => file.id === selectedFileId.value))

function openComputer(id: string) { selectedComputerId.value = id; selectedShareId.value = null; selectedFileId.value = null }
function openShare(id: string) { selectedShareId.value = id; selectedFileId.value = null }
function goBack() {
  if (selectedFileId.value) selectedFileId.value = null
  else if (selectedShareId.value) selectedShareId.value = null
  else if (selectedComputerId.value) selectedComputerId.value = null
}
function connectSettings() { windows.open("network-connections") }
</script>

<template>
  <div class="xp-network-places">
    <div class="xp-network-toolbar"><button :disabled="!selectedComputerId && !selectedShareId && !selectedFileId" @click="goBack">◀　后退</button><span>网络邻居</span><button @click="connectSettings">设置网络连接</button></div>
    <div class="xp-network-banner"><span>{{ system.networkConnected ? "🌐" : "⛔" }}</span><div><h2>{{ system.networkConnected ? "本地网络可用" : "网络电缆被拔出" }}</h2><p>{{ system.networkConnected ? "以下计算机和共享文件夹为本地模拟内容。" : "连接网络后可以浏览本地模拟共享资源。" }}</p></div><button @click="connectSettings">{{ system.networkConnected ? "查看连接" : "连接到网络" }}</button></div>
    <main v-if="system.networkConnected" class="xp-network-browser">
      <template v-if="selectedFile"><h2>{{ selectedFile.name }}</h2><pre>{{ selectedFile.content }}</pre></template>
      <template v-else-if="selectedShare"><button class="xp-network-back" @click="goBack">‹　{{ selectedComputer?.name }}</button><h2>共享文件夹：{{ selectedShare.name }}</h2><button v-for="file in selectedShare.files" :key="file.id" class="xp-network-file" @click="selectedFileId = file.id">📄　{{ file.name }}</button><p v-if="!selectedShare.files.length" class="xp-network-empty">此共享文件夹为空。</p></template>
      <template v-else-if="selectedComputer"><button class="xp-network-back" @click="goBack">‹　网络邻居</button><h2>{{ selectedComputer.name }}　{{ selectedComputer.description }}</h2><button v-for="share in selectedComputer.shares" :key="share.id" class="xp-network-share" @click="openShare(share.id)">📁　{{ share.name }}<small>{{ share.files.length }} 个对象</small></button></template>
      <template v-else><h2>工作组中的计算机</h2><button v-for="computer in system.availableSharedComputers" :key="computer.id" class="xp-network-computer" @click="openComputer(computer.id)"><span>🖥️</span><b>{{ computer.name }}</b><small>{{ computer.description }}</small></button></template>
    </main>
    <main v-else class="xp-network-disconnected"><span>⛔</span><b>当前没有可用的连接</b><p>连接操作只会切换本地模拟状态，不会访问网络。</p><button @click="system.connect()">连接本地模拟网络</button></main>
    <footer class="xp-network-status">{{ system.networkConnected ? `${system.availableSharedComputers.length} 台本地模拟计算机` : "网络已断开" }}　·　不会发送网络请求</footer>
  </div>
</template>
