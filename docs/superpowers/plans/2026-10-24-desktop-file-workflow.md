# Desktop and File Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the local desktop organization and Explorer workflows and publish the verified update to the repository's Vercel production homepage.

**Architecture:** Extend the current Pinia stores and local filesystem service with validated, persisted desktop customization and atomic file operations. Keep component state local for transient selection and clipboard, add local JSON backup/restore, and cover core behavior with Vitest/jsdom regression tests.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vite 4, Vitest, Vue Test Utils, jsdom, localStorage; existing CSS and native browser media controls.

**Spec:** `docs/superpowers/specs/2026-10-24-desktop-file-workflow-design.md`

## Global Constraints

- All app content, files, settings, history and network states stay local mock data; no external request or navigation is added.
- Persist icon arrangement, shortcuts, recent apps, per-app window geometry, filesystem and preferences; do not restore open windows after reload.
- Explorer clipboard is in-memory and never writes to the operating-system clipboard.
- Batch copy/move/import validates fully before one local write; no partial filesystem mutations on failure.
- Retain existing XP visual language, CSS/Vue animation, native audio and dependency choices except the Vitest/Vue Test Utils test tooling.
- Commit each independently usable major module before starting the next.

## Review Focus

- Malformed or legacy localStorage/backup values → validated defaults or no-op import without losing valid existing state (Tasks 1, 5).
- Copy/move of selected folders with descendants → preserve the full subtree and reject cycles/collisions atomically (Task 3).
- Search/cut/copy/paste while a dialog or input is focused → do not hijack typing or act on stale selections (Task 4).
- Drag, touch, keyboard and reduced-motion input across small and large viewports → maintain usable XP desktop controls without layout overflow (Tasks 2, 6).
- Interrupted Vercel build/deploy after pushing master → retain exact deployed commit and report actual production state (Task 7).

## Task 1: Regression runner and desktop preference model

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Create: `vitest.config.ts`, `src/test/setup.ts`, `src/test/runner.test.ts`
- Create: `src/mocks/desktop/preferences.ts`
- Modify: `src/store/desktopStore.ts`, `src/store/windowStore.ts`
- Test: `src/mocks/desktop/preferences.test.ts`, `src/store/windowStore.test.ts`

**Interfaces:**
- `DesktopPreferences` v2 stores `titles`, `hidden`, custom shortcuts `{ id, appId, title }[]`, manual icon positions `{ [id]: { x, y } }`, `sortMode: 'manual' | 'name' | 'type'`, and recent app IDs (max 5).
- `loadDesktopPreferences(raw: string | null): DesktopPreferences` validates v1/v2 values and supplies safe defaults; legacy v1 values migrate without dropping names/hidden shortcuts.
- Window layout persistence stores `{ appId, x, y, width, height }[]`; window session state remains transient. `open(appId)` applies the saved layout and `move`/`resize` saves it.

- [x] Add Vitest `0.34.6`, Vue Test Utils `2.4.6`, jsdom setup and package scripts (`test`, `test:watch`); run a runner smoke test before writing feature assertions.
- [x] Write and run failing tests named `migratesV1ShortcutState`, `fallsBackForMalformedDesktopState`, `keepsOnlyFiveRecentApps`, and `restoresWindowGeometryOnManualOpen`.
- [x] Implement v2 preference parsing and localStorage adapter with safe bounds for coordinates and labels.
- [x] Persist window geometry by app ID and restore it only on the next manual open; the new test must fail before the store change and pass after.
- [x] Run `pnpm test -- --run src/mocks/desktop/preferences.test.ts src/store/windowStore.test.ts` and `pnpm build`; commit `test: add desktop preference regression harness` / `feat: persist desktop preferences and window layouts` separately when boundaries are independently green.

## Task 2: Desktop ordering, shortcuts, recents, and pointer movement

**Files:**
- Modify: `src/store/desktopStore.ts`, `src/components/desktop/DesktopShell.vue`, `src/components/desktop/DesktopContextMenu.vue`, `src/components/desktop/StartMenu.vue`, `src/pages/DeskTop/IconGroup/index.vue`, `src/global.css`
- Test: `src/components/desktop/desktop-interactions.test.ts`

**Interfaces:**
- `desktop.createShortcut(appId, title?)`, `desktop.removeCustomShortcut(id)`, `desktop.recordRecentApp(appId)`, `desktop.setIconPosition(id, x, y)`, `desktop.setSortMode(mode)`, and `desktop.resetIconLayout()`.
- Icon presentation resolves custom shortcut IDs to their app ID for launch while keeping shortcut IDs for selection, rename, and delete.
- Desktop blank-area menu exposes grid sort modes and New Shortcut app picker; PC supports pointer drag; mobile retains flow grid.
- Start Menu shows the latest five installed local apps and updates on every launch path.

- [x] Write and run failing tests `createsAndRemovesCustomShortcut`, `recordsRecentLaunchOnce`, `persistsIconPosition`, and `resetsManualLayout`.
- [x] Implement menu selection, shortcut rename/delete protection, app launch recents, sort modes, drag/drop positions and reset layout.
- [x] Verify keyboard selection/actions and mobile grid ignores PC coordinates; run focused interaction tests/build; commit `feat: complete XP desktop organization`.

## Task 3: Atomic filesystem copy and move services

**Files:**
- Modify: `src/mocks/filesystem/service.ts`, `src/mocks/filesystem/storage.ts`, `src/store/filesystemStore.ts`
- Test: `src/mocks/filesystem/service.test.ts`

**Interfaces:**
- `filesystemService.copyEntries(ids, targetParentId): MockEntry[]` duplicates selected roots and every descendant with fresh IDs.
- `filesystemService.moveEntries(ids, targetParentId): MockEntry[]` moves selected roots while preserving IDs and parent-child structure.
- `filesystemStore.copyEntries/moveEntries` update Pinia state from the committed snapshot.
- Selection normalization removes descendants whose ancestor is also selected. Name collisions fail before persistence; copy collisions produce `名称 - 副本`, then `名称 - 副本 (2)`.

- [x] Write and run failing service tests `copiesNestedFolderWithFreshIds`, `normalizesAncestorAndDescendantSelection`, `namesCopiesWithoutOverwrite`, `rejectsMoveIntoDescendant`, and `leavesSnapshotUnchangedAfterBatchConflict`.
- [x] Implement pre-validation and single-snapshot writes for copy/move, rejecting system roots and moving a folder into its own subtree.
- [x] Run service tests and production build; commit `feat: add atomic local file copy and move`.

## Task 4: Explorer search, clipboard commands, and batch actions

**Files:**
- Modify: `src/components/apps/ExplorerApp.vue`, `src/components/apps/ExplorerToolbar.vue`, `src/components/apps/FileItem.vue`, `src/global.css`
- Test: `src/components/apps/ExplorerApp.test.ts`

**Interfaces:**
- `searchQuery` filters the current folder and its descendants by name and text content; clicking a folder result navigates to its original parent then opens it, files open preview.
- Session clipboard `{ mode: 'copy' | 'cut'; ids: string[] } | null`; keyboard shortcuts Ctrl/Meta+A/C/X/V are ignored for text inputs and dialogs.
- Explorer toolbar includes search; context/task actions include copy, cut, paste into the current folder, and delete selected.
- Batch delete sends each selected root to Recycle Bin; store/service remains the source of truth.

- [x] Write and run failing component tests `searchesCurrentFolderSubtree`, `doesNotHijackTextInputShortcuts`, `pastesCopiedItemsIntoCurrentFolder`, `movesCutFolderWithDescendants`, and `deletesMultipleRootsOnce`.
- [x] Implement local search results, clipboard state, context-menu actions and keyboard shortcuts with safe selection clearing after mutation.
- [x] Run focused UI tests plus type check/build; commit `feat: complete local Explorer workflows`.

## Task 5: Media preview and validated local backup/restore

**Files:**
- Create: `src/mocks/backup.ts`, `src/mocks/backup.test.ts`
- Modify: `src/components/apps/ExplorerApp.vue`, `src/components/apps/ControlPanelApp.vue`, `src/mocks/filesystem/storage.ts`, `src/store/preferencesStore.ts`, `src/store/desktopStore.ts`, `src/store/systemStore.ts`, `src/global.css`

**Interfaces:**
- Backup v1 JSON contains only filesystem, desktop preferences, appearance/sound/browser preferences and network connection state.
- `createLocalBackup(): LocalBackup` and `validateLocalBackup(value): LocalBackup` validate versions, IDs, tree relationships and persisted preference fields.
- `restoreLocalBackup(backup): void` writes all storage keys only after validation; storage failure rolls back previous key values.
- Control Panel provides Export and Import buttons using browser local file input/download; media preview shows native image/audio/text controls plus file type/size/date.

- [ ] Write and run failing tests `roundTripsAllLocalStores`, `rejectsUnknownBackupVersion`, `rejectsDuplicateFilesystemIds`, `rejectsMissingParent`, and `invalidImportDoesNotChangeStorage`.
- [ ] Implement normalized export/import adapter and connect local file picker/download controls.
- [ ] Improve media preview metadata and controls; run backup tests and production build; commit `feat: add local backup and richer previews`.

## Task 6: Accessibility, responsive behavior, and regression completion

**Files:**
- Modify: `src/global.css`, desktop and Explorer components touched above, `package.json`
- Test: desktop, Explorer and backup regression suites

- [ ] Cover keyboard open/menu/clipboard flows, visible focus, dialog labeling and touch-size controls in component tests where stable.
- [ ] Add reduced-motion CSS behavior for desktop and window transitions.
- [ ] Run the full regression suite, type check, production build, source scan for external request/navigation APIs, and manual PC/tablet/mobile browser walkthrough.
- [ ] Commit `test: cover local desktop and Explorer workflows` and `a11y: improve XP desktop keyboard and motion support` as separate module commits.

## Task 7: Publish and verify Vercel production homepage

**Files:**
- No source files; publish the final verified commit to upstream `master`.

- [ ] Fetch `origin/master`; require it to be an ancestor before fast-forward push; if it advanced independently, merge and rerun full verification.
- [ ] Push the exact reviewed commit to `origin/master` to trigger the repository's Vercel production deployment.
- [ ] Inspect GitHub commit deployment/status records and the linked production homepage; verify the served assets correspond to the new build.
- [ ] Report deployment URL, commit, and observed deployment status; never claim deployed if provider status is unavailable or failed.
