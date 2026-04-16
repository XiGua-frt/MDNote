# AGENTS.md - 开发任务指令与规范

## 1. 项目概述 (Project Overview)
本项目是一个基于 Web 的轻量级 Markdown 笔记应用。
- **核心目标**：实现左侧编辑（支持搜索/列表）、右侧实时预览的双栏编辑器。
- **技术栈**：React + TypeScript + Vite + Tailwind CSS。
- **核心库**：`react-markdown` (解析), `react-syntax-highlighter` (高亮)。
- **存储**：仅使用 `LocalStorage` 进行数据持久化。

## 2. 开发规范 (Development Standards)

### 2.1 代码风格
- **组件化**：采用函数式组件 (Functional Components) 和 Hooks。
- **类型安全**：所有数据结构、Props 和函数参数必须显式定义 TypeScript 类型，严禁使用 `any`。
- **目录结构**：
  - `/src/components`: 存放 UI 组件（如 Editor, Preview, Sidebar）。
  - `/src/hooks`: 存放逻辑封装（如 `useLocalStorage`）。
  - `/src/types`: 存放全局类型定义（如 `Note` 接口）。

### 2.2 命名约定
- 组件文件：大驼峰 (PascalCase)，如 `NoteList.tsx`。
- 逻辑函数/变量：小驼峰 (camelCase)。
- 常量定义：全大写下划线 (UPPER_SNAKE_CASE)。

## 3. 设计要求 (Design Requirements)

### 3.1 UI/UX
- **布局**：使用 Tailwind CSS 实现响应式 Flex 或 Grid 布局。
- **样式**：界面要求简洁明快（Minimalist），侧边栏与主编辑器区域要有视觉区分。
- **预览效果**：代码块渲染必须支持语法高亮，默认推荐使用 `atom-one-dark` 或 `vsc-dark-plus` 主题。

### 3.2 功能逻辑
- **实时性**：onChange 触发状态更新需流畅，考虑使用防抖 (debounce) 优化大规模文本渲染性能。
- **搜索**：搜索逻辑应同时匹配标题和内容。

## 4. 注意事项 (Precautions)

1. **依赖冲突**：安装插件时注意 `react-markdown` 与 `react-syntax-highlighter` 的版本兼容性（推荐最新稳定版）。
2. **数据安全**：在处理 `LocalStorage` 时，务必添加 `try-catch` 处理 JSON 解析异常。
3. **样式污染**：确保 Markdown 的样式（如 h1, ul, li）只作用于预览区，不要影响全局 UI 样式。建议在预览区使用 `prose` 类名（配合 `@tailwindcss/typography` 插件）。
