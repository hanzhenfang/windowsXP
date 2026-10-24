# 登录页解锁交互实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 保留 XP 登录页，提供可访问且幂等的桌面进入动作，并让拖动交互在取消和卸载时可靠复位。

**Architecture:** 用小型纯状态模块定义选择、进入中、完成状态和唯一的进入门闩；登录页统一拥有移动/PC 的进入按钮；PC 滑块仅处理本地 Pointer Events，并通过回调进入统一流程。移动端选头像后显示按钮，不再依赖二次点击。

**Tech Stack:** Vue 3 Composition API、TypeScript、Node 内置 `node:test`。

**Spec:** `docs/superpowers/specs/2026-10-24-login-unlock-design.md`

## Global Constraints

- 不新增“我的简历”桌面图标。
- 不跳过或弱化登录页。
- PC 拖动和显式按钮共用同一进入动作。
- 移动端选择头像后必须由用户点击“进入桌面”确认。
- 正在进入或已进入时忽略重复触发。
- 不新增运行时依赖。

## Review Focus

- 重复点击按钮或拖动完成：路由只进入一次；状态模块测试。
- 拖动时松开、取消或失去指针捕获：头像归位；指针清理测试与浏览器验证。
- 路由卸载时仍在拖动：不留下全局事件处理器；组件生命周期代码审阅。
- 移动端头像选择：不自动导航，按钮出现；浏览器验证。
- 窄视口和短屏：进入按钮保持可见可点；浏览器验证。

---

### Task 1: 解锁状态门闩

**Files:**
- Create: `src/utils/unlockFlow.js`
- Create: `src/utils/unlockFlow.d.ts`
- Create: `src/utils/unlockFlow.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `createUnlockFlow()` with `select()`, `deselect()`, `begin()`, `cancelEntry()`, and `complete()` transitions; `begin()` returns false after entering/entered. `deselect()` only clears a selection before entry begins; `cancelEntry()` restores the state captured before an unsuccessful route change.

- [x] **Step 1: Write tests** for initial selection, one successful begin, and duplicate begin rejection.
- [x] **Step 2: Run `node --test src/utils/unlockFlow.test.mjs` and confirm the expected missing-module failure.**
- [x] **Step 3: Implement the minimal pure state module and TypeScript declaration.**
- [x] **Step 4: Re-run the focused Node test and confirm all transitions.**

### Task 2: Unified login actions and pointer lifecycle

**Files:**
- Modify: `src/pages/Password/index.vue`
- Modify: `src/pages/Password/PCLogin/index.vue`
- Modify: `src/pages/Password/MobileLogin/index.vue` only if needed for a clear selected state.

**Interfaces:**
- Consumes: `createUnlockFlow()` from Task 1.
- Produces: a single login-page `enterDesktop()` action; `PCLogin` emits `unlock` after drag threshold and supports a clear selected/dragging state.

- [x] **Step 1: Bind PC drag and the explicit button to the shared enter action; show the mobile button only after avatar selection.**
- [x] **Step 2: Replace document-level pointer properties with captured pointer events on the slider; reset on up, cancel, lost capture, resize, and unmount.**
- [x] **Step 3: Verify mobile selection does not navigate and button does; verify PC drag and button both navigate once, and cancelled drags restore the avatar.**

### Task 3: Verification

**Files:**
- No additional files.

- [x] **Step 1: Run `node --test src/utils/unlockFlow.test.mjs`.**
- [x] **Step 2: Run `npm run type-check` and `npm run build-only`.**
- [x] **Step 3: Inspect desktop and mobile browser behavior, including repeated activation and drag cancellation.**

