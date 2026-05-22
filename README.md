<p align="center">
  <img src="resources/icon.png" width="128" height="128" alt="Meeemo icon" />
</p>

<h1 align="center">Meeemo</h1>

<p align="center">
  <b>A translucent, Raycast-style memo app that lives in your macOS menu bar.</b>
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#usage">Usage</a> ·
  <a href="#development">Development</a> ·
  <a href="#中文说明">中文说明</a>
</p>

---

## Update Log

### v0.3.0

**Settings & Menu**
- **Unified Settings** — Independent Settings window with sidebar nav (General / Appearance / Image Host / Check for Update). All preferences (hotkey, theme, opacity, blur, storage, image host) live in one place.
- **Native macOS Menu Bar** — Meeemo / Settings / File / Edit / View / Window / Help. ⌘N new memo, ⌘⇧N new todo list, ⌘, settings, ⌘⇧O reveal storage in Finder.

**Tray & Panel**
- **Right-click Tray Menu** — New Note (create + open), New Todo (focus first list's add input), Open Latest, Quit.
- **Todo / Note Dual Tab** — The tray popover now hosts both a Todo tab and a Note tab; drag the tabs to swap their order.
- **Note Tab** — Lists all memos with double-click rename, drag-to-reorder, hover delete (with confirm), and click-to-open. Quick + New and settings gear in the tab header.
- **Cat Tray Icon** — Empty todo list shows a cat icon; non-empty shows a checkmark with the unfinished count.

**Editor**
- **True Window Blur** — Replaced opaque NSVisualEffectView with private SkyLight blur (the trick Terminal / wezterm use). Behind the window now actually blurs, including other apps.
- **Independent Blur Slider** — Opacity and blur are now two separate Appearance controls.
- **System Theme** — Theme adds a `system` option that follows macOS appearance in real time.

**Todo**
- **Pin Tasks** — Click 📌 to pin a task to the top of the list. Pinned tasks keep their position even when checked off; new tasks land after the pin segment.
- **Inline Rename** — Double-click a task text to edit; Enter / blur to commit, Esc to cancel.
- **Drag-Drop Fix** — Drop animation now lands on the final position without the previous bounce-back.

**Storage**
- **Reliable Path Persistence** — Config moved to `~/Library/Application Support/Meeemo/`, so changing the storage path no longer loses the new value after restart.
- **Migrate from Previous Storage** — Copy files from any previously used storage folder into the current one, with an optional source delete confirmation.

**Bug Fixes**
- Editor close handler used a stale closure snapshot of `lastWindowState`, overwriting any panel / font color / opacity changes made during the session. Now only window bounds get persisted on close.

### v0.2.0

**TODO Task**
- **Task Reminders & Notify** — Set due date & time on any todo. Notified via tray dropdown popup (with color-highlighted due status) or system notification. Configurable lead time and notification type (tray / system / both).
- **Overdue Tracking** — Tray badge shows overdue count (`2!·4`). Overdue tasks highlighted in amber with auto-expanding alert banner.
- **Recycle Bin** — Deleted tasks move to a trash tab. Restore or permanently delete anytime.

**Note Editor**
- **Image Support** — Paste or drag images into the editor. Stored locally in `~/meeemo/assets`.
- **Configurable Shortcut Landing** — Global hotkey target is now configurable: open command palette, notes, or todo panel.
- **Inline Calculator** — Type `10 + 20 =` and a ghost result appears. Press Tab to confirm. Supports complex math (`sqrt(144)`, `2^10`, `sin(45 deg)`), unit conversion (`5 kg to lb`, `100 cm to inch`), and full-width CJK symbols (`（）×÷，`).

**Bug Fixes**
- Fixed bullet points (`-`) not rendering in Markdown editor mode.

---

## Features

- **Command Palette** — Press `⌥ Space` to summon a Raycast-style palette. Search, create, and open memos instantly.
- **Translucent Editor** — Frameless, frosted-glass window with native macOS vibrancy. Adjustable opacity, panel color, and font color.
- **Markdown & Plain Text** — Switch between a rich Tiptap editor (with task lists) and a plain-text mode. All memos are stored as `.md` files.
- **Todo from Tray** — Click the menu bar icon to pop open a lightweight todo panel. Drag to reorder, organize with multiple tabs.
- **Always on Top** — Pin the editor above all windows, keep it at normal level, or push it behind everything.
- **Local-first** — All data lives in `~/meeemo` as plain Markdown files. No account, no cloud, no telemetry.
- **Configurable Shortcut** — Remap the global hotkey in Settings.
- **Multi-monitor** — Palette and editor always appear on the display where your cursor is.

## Installation

Download the latest `.dmg` from [Releases](https://github.com/KasparChen/meeemo/releases), open it and drag **Meeemo** to Applications.

> Requires macOS 12+.

## Usage

| Action | How |
|---|---|
| Open palette | `⌥ Space` (default, configurable) |
| Create memo | Type a name in the palette and press Enter |
| Search memos | Start typing in the palette |
| Open todo | Click the ✓ icon in the menu bar |
| Toggle always-on-top | Editor header → Menu → Always on Top |
| Switch Markdown / Plain Text | Editor header toggle button |
| Change appearance | Editor header → Settings (opacity, color, blur) |
| Change storage path | Editor header → Settings → Storage Path |

## Development

```bash
# Install dependencies
npm install

# Run in dev mode
npm run dev

# Build distributable DMG
npm run dist
```

### Tech stack

- **Electron** + **electron-vite** — app shell & build tooling
- **React 19** + **TypeScript** — renderer
- **Tailwind CSS 4** — styling
- **Tiptap** — rich-text / Markdown editor
- **Native macOS vibrancy** addon (N-API) — real frosted-glass effect

### Project structure

```
src/
  main/          # Electron main process
    index.ts     # App entry, global shortcut, IPC
    windows.ts   # Palette / Editor / Todo window management
    memo-service.ts   # CRUD for Markdown memo files
    todo-service.ts   # Todo list persistence
    tray.ts      # Menu bar tray icon + badge
    config.ts    # App config (~/meeemo/config.json)
  preload/       # Context bridge
  renderer/
    src/
      palette/   # Command palette UI
      editor/    # Memo editor (Tiptap + plain text)
      todo/      # Todo panel UI
native/          # macOS vibrancy N-API addon
resources/       # App icon
```

---

## 中文说明

### 简介

Meeemo 是一款 macOS 桌面便签应用，灵感来自 Raycast。按下快捷键即可唤起命令面板，快速创建、搜索和编辑备忘录。编辑器窗口支持原生毛玻璃半透明效果，可自定义透明度、面板颜色和字体颜色。

### 更新日志

#### v0.3.0

**设置与菜单**
- **统一设置中心** — 独立 Settings 窗口（左侧导航：General / Appearance / Image Host / Check for Update），所有偏好（热键、主题、透明度、blur、存储路径、图床）集中一处管理
- **原生 macOS 顶栏菜单** — Meeemo / Settings / File / Edit / View / Window / Help。`⌘N` 新建 memo、`⌘⇧N` 新建 todo list、`⌘,` 打开设置、`⌘⇧O` 在 Finder 中显示存储目录

**Tray 与面板**
- **Tray 右键菜单** — New Note（直接创建并打开）、New Todo（弹出面板并 focus 到首个 list 的添加输入框）、Open Latest（打开最近编辑的 note）、Quit
- **Todo / Note 双 Tab** — Tray popover 同时承载待办和笔记两个 Tab，长按可拖拽互换顺序
- **Note Tab** — 列出所有 memo，双击重命名，拖拽排序，hover 删除带二次确认，点击直接打开；右上 + New 与设置齿轮快捷入口
- **猫咪 Tray 图标** — 没有待办时显示猫咪图标，有待办时切回 checkmark + 未完成数量角标

**编辑器**
- **真实窗口模糊** — 去掉了不透明的 NSVisualEffectView，改用 SkyLight 私有 API（Terminal / wezterm / ghostty 同款）让窗户后方真实模糊，包括其他 App 的内容
- **独立 Blur 滑块** — Settings → Appearance 把 opacity 与 blur 拆成两个独立可调的滑块
- **System 主题** — Theme 新增 system 选项，跟随 macOS 外观实时切换

**待办**
- **任务置顶** — 点击 📌 把任务置顶。置顶任务即使勾选完成也留在 pin 段不下沉，新建任务落在 pin 段之后
- **双击重命名** — 直接双击任务文本进入编辑态，回车 / 失焦提交，Esc 取消
- **拖拽手感修复** — drop 动画直接落到最终位置，不再回弹

**存储**
- **路径持久化修复** — config.json 移到 `~/Library/Application Support/Meeemo/`，更改存储路径后重启不再丢失
- **迁移历史目录** — 从任意曾经用过的目录把文件迁到当前目录，可选迁移后删除源目录（带二次确认）

**Bug 修复**
- 修复编辑器关闭时用 closure 旧快照覆盖 `lastWindowState`，导致 session 中改的 panel / font color / opacity 被回滚的问题；现在关闭只持久化窗口位置

#### v0.2.0

**TODO 待办**
- **任务提醒与通知** — 为待办设置到期时间，通过 Tray 下拉弹窗（带颜色高亮的 due 状态）或系统通知提醒，支持配置提前通知时间和通知方式
- **逾期追踪** — Tray 角标显示逾期数量（`2!·4`），逾期任务 amber 高亮，自动展开提醒横幅
- **回收站** — 删除的任务进入回收站 Tab，可恢复或永久删除

**笔记编辑器**
- **图片支持** — 编辑器内粘贴或拖拽图片，本地存储于 `~/meeemo/assets`
- **快捷键落地配置** — 全局热键目标可配置：打开命令面板、笔记或待办
- **内联计算器** — 输入 `10 + 20 =` 后出现半透明预测结果，按 Tab 确认。支持复杂运算（`sqrt(144)`、`2^10`、`sin(45 deg)`）、单位换算（`5 kg to lb`、`100 cm to inch`），以及中文全角符号（`（）×÷，`）

**Bug 修复**
- 修复 Markdown 编辑模式下 `-` 列表不显示 bullet point 的问题

### 主要特性

- **命令面板** — 按 `⌥ Space` 唤起，即搜即创建
- **半透明编辑器** — 无边框毛玻璃窗口，原生 macOS vibrancy 效果
- **Markdown & 纯文本** — 富文本编辑器（支持任务列表）与纯文本模式一键切换，所有内容以 `.md` 文件存储
- **菜单栏待办** — 点击菜单栏图标弹出轻量待办面板，支持拖拽排序和多标签页
- **窗口置顶** — 编辑器可置顶、常规层级或置底
- **本地优先** — 数据保存在 `~/meeemo`，纯 Markdown 文件，无需账号、无云端、无遥测
- **自定义快捷键** — 在设置中修改全局热键
- **多显示器** — 面板和编辑器始终出现在光标所在的屏幕

### 安装

从 [Releases](https://github.com/KasparChen/meeemo/releases) 下载最新 `.dmg`，打开后将 **Meeemo** 拖入"应用程序"文件夹。

> 需要 macOS 12 及以上版本。

### 开发

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建 DMG 安装包
npm run dist
```

---

## License

[GPL-3.0](LICENSE)
