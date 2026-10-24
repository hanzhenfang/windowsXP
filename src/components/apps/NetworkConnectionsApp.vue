<script lang="ts" setup>
import { ref } from "vue"
import { useSystemStore } from "@/store/systemStore"
import { useWindowStore } from "@/store/windowStore"

const system = useSystemStore()
const windows = useWindowStore()
const diagnostic = ref("")
function runDiagnostics() {
  diagnostic.value = system.networkConnected
    ? "诊断完成：本地模拟连接正常，共享计算机可用。"
    : "诊断完成：本地模拟连接已断开，请使用“连接”按钮恢复。"
}
</script>

<template>
  <div class="xp-network-connections">
    <aside class="xp-network-connection-task"><h3>网络任务</h3><button @click="windows.open('network')">🌐　查看网络邻居</button><button @click="runDiagnostics">🛠️　诊断此连接</button><h3>详细信息</h3><p>本地模拟适配器</p></aside>
    <main>
      <header><h2>局域网或高速 Internet</h2><p>此连接的所有状态都只保存在本地。</p></header>
      <button class="xp-network-connection-card" :class="{ connected: system.networkConnected }" @click="system.toggleConnection()">
        <span class="xp-connection-icon">{{ system.networkConnected ? "🌐" : "⛔" }}</span>
        <span><b>本地连接</b><small>{{ system.networkConnected ? "已连接" : "网络电缆被拔出" }}</small><small>模拟网卡 · 信号强度：{{ system.signalStrength }}/4</small></span>
      </button>
      <section class="xp-network-connection-details"><b>连接状态</b><span>{{ system.networkConnected ? "已连接" : "已断开" }}</span><b>连接名称</b><span>局域网连接</span><b>IP 地址</b><span>{{ system.networkConnected ? "192.168.1.23（模拟）" : "未分配" }}</span><b>共享资源</b><span>{{ system.networkConnected ? `${system.sharedComputers.length} 台本地计算机` : "不可用" }}</span></section>
      <p v-if="diagnostic" class="xp-network-diagnostic">{{ diagnostic }}</p>
      <footer><button class="primary" @click="system.toggleConnection()">{{ system.networkConnected ? "断开连接" : "连接" }}</button><button @click="windows.open('network')">打开网络邻居</button></footer>
    </main>
  </div>
</template>
