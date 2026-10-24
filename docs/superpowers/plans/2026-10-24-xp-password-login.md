# Windows XP 密码登录页实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 PC 登录界面改为 XP 风格头像、账户名和密码登录，并校准品牌分栏。

**Architecture:** 在现有 PC 登录组件中实现头像账户卡片和密码表单，通过现有 `unlock` 事件调用父页面唯一的进入桌面流程。父页面移除拖拽配置与独立入口按钮，并保留移动端分支。

**Tech Stack:** Vue 3 `<script setup>`、TypeScript、Scoped CSS。

**Spec:** `docs/superpowers/specs/2026-10-24-xp-password-login-design.md`

## Global Constraints

- 账户名显示“韩振方”。
- PC 密码回车和登录按钮共用现有 `enterDesktop` 导航流程。
- 移动端选账户流程、页脚返回/关机与桌面路由保持可用。

## Review Focus

- 空密码仍允许进入，因为本地仿真没有密码校验后端；检查提交按钮路径。
- 登录中重复提交应由现有 unlock 状态忽略；检查 disabled 状态传递。
- 窄屏布局不应横向溢出；检查 scoped media rules。

---

### Task 1: PC 登录组件和页面布局

**Files:**
- Modify: `src/pages/Password/PCLogin/index.vue`
- Modify: `src/pages/Password/index.vue`

- [ ] 移除 PC 拖动相关 Pointer Events、滑轨和提示，改为头像、账户名、密码输入框和“登录”提交按钮；通过现有 `unlock` emit 提交。
- [ ] 调整父页面品牌区和登录区的分栏比例、边距和对齐，删除独立“进入桌面”按钮，不触碰移动端选择组件。
- [ ] 为 PC 表单增加适配窄视口的样式，并确保键盘焦点可见。
- [ ] 检查父页面仅在提交时调用原 `enterDesktop`，其余登录状态与页脚仍工作。
