# Windows XP 桌面壳层功能补全实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 补齐开始菜单、电源、桌面命令、模拟应用、窗口管理、持久化和键盘操作。

**Architecture:** 继续使用 Vue 3 组件与 Pinia Store，增加轻量的桌面偏好/会话状态并复用 Vue Router。外部动作限定为用户主动点击后打开外链；所有电源行为都在页面内模拟。

**Tech Stack:** Vue 3 `<script setup>`、TypeScript、Pinia、Vue Router、localStorage、Scoped CSS。

**Spec:** `docs/superpowers/specs/2026-10-24-desktop-shell-completion-design.md`

## Global Constraints

- 不操作真实计算机电源或本机磁盘。
- 不增加服务端账号认证；演示登录阻止空密码即可。
- 不改变现有 XP 素材、主要配色、桌面入口和移动端单窗口模式。
- localStorage 失败须回退默认值；不得清理无关存储。

## Review Focus

- 电源模拟后的返回路径：每个状态均有取消、唤醒或重启入口；逐项人工检查对话框操作。
- 登录中的重复提交：已有状态机仍只导航一次；检查 disabled 和路由流。
- localStorage 含旧版本或坏 JSON：恢复默认状态；手动注入无效数据后启动。
- 窗口超出当前视口/切换窄屏：窗口位置和尺寸可恢复；检查窗口边界与移动端切换。
- 键盘快捷键与输入冲突：输入框聚焦时不截获字符；检查表单键盘路径。

---

### Task 1: 开始菜单与电源模拟

**Files:**
- Modify: `src/pages/DeskTop/Footer/index.vue`
- Modify: `src/components/Modal/ShutDown/ShutDown.vue`
- Modify: `src/components/Modal/ShutDown/index.ts`
- Modify: `src/pages/DeskTop/IconGroup/iconGroup.ts`
- Modify: `src/pages/DeskTop/index.vue`
- Modify: `src/pages/Password/index.vue`

- [ ] 将开始菜单分为应用列表和所有程序列表；增加注销、锁定与“关闭计算机”入口。
- [ ] 将桌面电源入口接到独立的 XP 风格对话框；实现待机、模拟关机、重启、取消按钮及关机后的恢复入口。
- [ ] 注销/锁定返回登录；重启走启动页；关机与待机只显示本地模拟 UI，不调用系统 API。
- [ ] 确保对话框每个按钮只触发对应操作，遮罩点击和 Escape 可关闭。
- [ ] 运行 `npm run build` 并在 PC/窄屏浏览器分别检查开始菜单和电源状态。

### Task 2: 桌面菜单与属性

**Files:**
- Modify: `src/pages/DeskTop/PCDeskTop/index.vue`
- Modify: `src/pages/DeskTop/IconGroup/index.vue`
- Modify: `src/components/ClickMenu/Menu.vue`
- Modify: `src/store/windowStore.ts`
- Modify: `src/components/Window/AppWindow.vue`
- Modify: `src/global.css`

- [ ] 实现桌面刷新、图标排列模式和新建快捷方式选择流程。
- [ ] 实现桌面快捷方式复制/粘贴以及“打开、属性”命令；无剪贴板内容时禁用粘贴。
- [ ] 属性窗口名称字段可编辑；确定保存、取消放弃、应用保存但不关闭。
- [ ] 补齐窗口工具栏最小化、最大化、还原、关闭和帮助/关于的可用命令；其余无对应能力的命令显示禁用态。
- [ ] 运行 `npm run build` 并手动检查各上下文菜单状态和属性保存行为。

### Task 3: 模拟应用与窗口管理

**Files:**
- Modify: `src/apps/manifest.ts`
- Modify: `src/components/Window/AppWindow.vue`
- Modify: `src/store/windowStore.ts`
- Modify: `src/global.css`

- [ ] 我的电脑提供可点选的模拟磁盘/位置；回收站提供示例项目的还原与清空；网络邻居明确显示演示状态。
- [ ] Internet Explorer 窗口作为网址输入/外链启动器；页面明确显示会在新标签打开；个人博客展示不同的介绍卡片及目标链接。
- [ ] 桌面窗口支持调整大小并将变化写回 Store；移动窗口不得移出桌面可见区域。
- [ ] 检查 PC 多窗口和移动端单窗口均可正常打开、激活、最大化、最小化及关闭。
- [ ] 运行 `npm run build` 并在浏览器手动操作每个应用窗口。

### Task 4: 偏好持久化与键盘操作

**Files:**
- Modify: `src/store/windowStore.ts`
- Modify: `src/pages/DeskTop/index.vue`
- Modify: `src/pages/DeskTop/Footer/index.vue`
- Modify: `src/pages/DeskTop/IconGroup/index.vue`
- Modify: `src/global.css`

- [ ] 持久化桌面图标布局、标题覆盖、窗口几何状态和开始菜单偏好；解析失败回退默认值。
- [ ] 实现 Win、Escape、Alt+Tab、Enter 快捷键，并在表单编辑时避开输入快捷键。
- [ ] 为新增按钮、菜单和模拟状态提供清晰的可见焦点与辅助技术标签。
- [ ] 运行 `npm run build`；手动检查刷新恢复、坏存储回退、快捷键、PC/移动端布局。
