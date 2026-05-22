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

Sorry for the delay, things have been busy. Thanks for all the feedback, it's shipped now.

#### 1. Settings entries

**1.1 Multiple ways to reach Settings**

a) `Settings` under the menu bar
<img width="264" alt="menu bar settings" src="https://github.com/user-attachments/assets/4c81ce70-fe70-442f-9dd5-c6a1bd22a656" />

b) In-editor `Settings` shortcuts jump straight to the matching section
<img width="450" alt="settings sections" src="https://github.com/user-attachments/assets/69ccdc1f-00fa-45b5-a690-19dd9c7ad399" />

c) Settings icon in the tray menu
<img width="325" alt="tray settings icon" src="https://github.com/user-attachments/assets/45558fcc-8893-43c1-861e-60d13f6496bb" />

**1.2 Removed the confusing `>_` entry, moved every preference into a dedicated panel, refreshed the Settings icon**
<img width="1257" alt="settings panel" src="https://github.com/user-attachments/assets/3c789b61-03b3-42a3-a6ab-dac7dd0301ef" />

#### 2. Storage path bug fixed plus a one-click Migration tool

**2.1 Pick any folder as the storage location, restore to the default folder anytime**
<img width="483" alt="storage location" src="https://github.com/user-attachments/assets/a5849601-e6f3-47a0-ac41-20e785de8285" />

**2.2 Migrate from any previously used folder**

Keep or delete the source files after migration.
<img width="484" alt="migrate dialog" src="https://github.com/user-attachments/assets/e1040c0d-0355-4db8-b00d-cca559d12e22" />

If you choose not to keep the source, a confirmation dialog catches accidental deletions.
<img width="715" alt="migrate confirm delete" src="https://github.com/user-attachments/assets/0d8e2407-cf51-4dff-976d-9552c0c35ffc" />

#### 3. Fixed the bug that blocked editing existing todos

**3.1 Double-click a task to enter edit mode**
<img width="300" alt="todo inline rename" src="https://github.com/user-attachments/assets/e5a4c294-e7a6-48c8-bf92-ff9ef752aedc" />

#### 4. Tray menu now holds the Note list and creation flows

**4.1 Cat icon shows up when there's nothing on the todo list**

**4.2 Note list with a create button**
<img width="314" alt="note tab" src="https://github.com/user-attachments/assets/024552bc-5cf9-49c2-989a-0654359073ae" />

**4.3 Drag the Todo / Note tabs to swap their order**
<img width="326" alt="drag tabs" src="https://github.com/user-attachments/assets/4ed55015-4ea1-4759-bebf-3a1fdd09753e" />

**4.4 Right-click the tray icon for a quick create / open menu**
<img width="197" alt="tray right click menu" src="https://github.com/user-attachments/assets/9c8cb142-b372-4308-aa28-d9405109b354" />

#### 5. Pin todos

Pin tasks to the top; they stay put even after being checked off.
<img width="341" alt="pin task" src="https://github.com/user-attachments/assets/1711f2b7-8929-4601-a809-f5667e1e56ba" />

#### 6. Opacity and blur bugs fixed

You can now tune both independently in `Settings`.
<img width="1240" alt="opacity blur" src="https://github.com/user-attachments/assets/970c7b02-b80d-4efd-9324-9b74aafe5bc1" />

#### 7. Misc

- Theme follows the system appearance
- Fixed a bug where color tweaks did not apply

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

抱歉，前段时间太忙了，才看到。感谢反馈，已更新！

##### 1. `设置` 入口

**1.1 新增多处 设置 入口：**

a) 目录菜单下的 `Setting`
<img width="264" alt="目录菜单 Setting" src="https://github.com/user-attachments/assets/4c81ce70-fe70-442f-9dd5-c6a1bd22a656" />

b) 外显的 `Setting` 可以直接到对应设置种类
<img width="450" alt="设置分类" src="https://github.com/user-attachments/assets/69ccdc1f-00fa-45b5-a690-19dd9c7ad399" />

c) Tray 菜单内的 `Setting` Icon
<img width="325" alt="Tray Setting Icon" src="https://github.com/user-attachments/assets/45558fcc-8893-43c1-861e-60d13f6496bb" />

**1.2 移除了令人困惑的 `>_`，将所有设置改为独立面板进行配置，并更新了设置 Icon**
<img width="1257" alt="独立设置面板" src="https://github.com/user-attachments/assets/3c789b61-03b3-42a3-a6ab-dac7dd0301ef" />

##### 2. 储存目录 BUG 已修复，并新增 `一键迁移` 功能

**2.1 目前可以随意指定目标的储存目录，并可恢复指定默认目录**
<img width="483" alt="储存目录" src="https://github.com/user-attachments/assets/a5849601-e6f3-47a0-ac41-20e785de8285" />

**2.2 新增 从历史目录中迁移 的功能**

可选择保留或删除迁移后文件。
<img width="484" alt="迁移弹窗" src="https://github.com/user-attachments/assets/e1040c0d-0355-4db8-b00d-cca559d12e22" />

不保留的话会触发二次确认。
<img width="715" alt="迁移二次确认" src="https://github.com/user-attachments/assets/0d8e2407-cf51-4dff-976d-9552c0c35ffc" />

##### 3. 修复 TODO 任务无法更改 BUG

**3.1 目前可以双击进入编辑模式**
<img width="300" alt="双击编辑" src="https://github.com/user-attachments/assets/e5a4c294-e7a6-48c8-bf92-ff9ef752aedc" />

##### 4. Tray 菜单入口新增 Note 列表与创建

**4.1 增加了在无任务状态下的 小猫 icon**

**4.2 增加了 Notes 的列表展示以及创建按钮**
<img width="314" alt="Notes 列表" src="https://github.com/user-attachments/assets/024552bc-5cf9-49c2-989a-0654359073ae" />

**4.3 增加 TODO 与 Notes 页签的拖拽排序功能**
<img width="326" alt="页签拖拽" src="https://github.com/user-attachments/assets/4ed55015-4ea1-4759-bebf-3a1fdd09753e" />

**4.4 增加右键单击 Tray 图标的快捷创建/打开列表**
<img width="197" alt="Tray 右键菜单" src="https://github.com/user-attachments/assets/9c8cb142-b372-4308-aa28-d9405109b354" />

##### 5. 增加了 Todo 任务的 Pin 功能

<img width="341" alt="Pin 任务" src="https://github.com/user-attachments/assets/1711f2b7-8929-4601-a809-f5667e1e56ba" />

##### 6. 修复了透明度与背景模糊 BUG

目前可以在 `Setting` 当中分别进行调整。
<img width="1240" alt="透明度与模糊" src="https://github.com/user-attachments/assets/970c7b02-b80d-4efd-9324-9b74aafe5bc1" />

##### 7. 其他

- 新增了 `跟随系统` 的颜色配置
- 修复了 调整配色不生效 的 BUG

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
