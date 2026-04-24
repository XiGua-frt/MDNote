# AGENTS.md — MDNote 编码规范与约束

> 本文件用于约束 AI Agent（如 Claude、Cursor、Copilot 等）在 MDNote 项目中的编码行为。所有 Agent 在修改代码前必须阅读本文件，并严格遵守以下规则。

---

## 一、技术栈约束（禁止擅自引入新依赖）

| 类别 | 当前选型 | 禁止替换为 |
|------|----------|-----------|
| 运行时 | React 18.3.x | Vue、Svelte、Solid 等 |
| 语言 | TypeScript 5.x | JavaScript（不得降级） |
| 构建 | Vite 5.x | Webpack、Parcel、Next.js 等 |
| 样式 | Tailwind CSS 3.x | CSS Modules、styled-components、emotion 等 |
| Markdown 解析 | `react-markdown` v9 + `remark-gfm` + `remark-breaks` + `rehype-raw` | `marked`、`markdown-it` 等 |
| 代码高亮 | 原生 `prismjs` 1.29.0（固定版本） | `react-syntax-highlighter`、`highlight.js`、`shiki` 等 |
| 图表 | `mermaid`（直接调用 `mermaid.render()`），通过 `MermaidRenderer.tsx` 组件 + `mermaidInit.ts` 初始化 | `rehype-mermaid` 或其他 rehype 插件渲染 Mermaid |
| 图标 | `lucide-react` | `react-icons`、`heroicons`、Font Awesome 等 |
| 拖拽 | `@dnd-kit/core` | `react-dnd`、`react-beautiful-dnd` 等 |
| 本地文件 | `browser-fs-access` | 原生 `<input type="file">` 直接替代（功能覆盖不完整） |
| 打印 / PDF | `react-to-print` | `jspdf`、`html2canvas`、`puppeteer` 等 |
| 持久化 | `localStorage` + 自封装 Hook | IndexedDB、云端存储（除非明确需求） |

**若必须引入新依赖，须在 PR 描述中说明理由，并获得人工审核批准后方可合并。**

---

## 二、Prism.js 专项规则（高优先级）

1. **版本锁定**：`prismjs` 必须固定为 **1.29.0**，`package.json` 的 `overrides` 字段也须同步锁定，禁止升级或降级。

2. **单例原则**：所有业务模块必须通过 `import Prism from '../prism-loader'`（按实际相对路径）引入 Prism，**禁止** `import Prism from 'prismjs'` 直接导入。

3. **语言包加载顺序**：新增语言包时须在 `src/prism-loader.ts` 中按依赖顺序注册。`prism-php` **必须** 在 `prism-markup-templating` 之后加载，违反顺序会导致运行时 `tokenizePlaceholders` 错误。

4. **禁止重复实例**：不得在业务组件内单独 `import` 任何 `prismjs/components/...` 语法包，统一由 `prism-loader.ts` 管理。

5. **`window.Prism`**：`prism-loader.ts` 负责在加载完成后执行 `window.Prism = Prism`，其他文件不得重复赋值。

---

## 三、核心文件修改规范

### 3.1 禁止随意修改的文件

以下文件为核心稳定模块，修改前须充分理解其上下游影响，并在改动说明中列出影响链：

| 文件 | 原因 |
|------|------|
| `src/prism-loader.ts` | Prism 单例与语言包注册，牵一发动全身 |
| `src/hooks/useAsyncMarkdown.ts` | Markdown 渲染管线核心 |
| `src/utils/formatMarkdownSource.ts` | 所有 Markdown 入口预处理，修改会影响全局渲染 |
| `src/App.tsx` | 路由级状态、级联删除逻辑、移动端抽屉，逻辑复杂 |
| `src/utils/mermaidInit.ts` | Mermaid 单例初始化，themeVariables 全局配置 |
| `tailwind.config.ts` | 全局排版与 `prose-invert` 微调，改动影响打印与预览 |

### 3.2 新增组件规范

- 组件文件放置于 `src/components/`，Hook 放置于 `src/hooks/`，工具函数放置于 `src/utils/`。
- 组件必须使用 **函数组件 + Hooks**，禁止 Class 组件。
- 新组件必须有 **TypeScript 类型注解**，禁止使用 `any`（特殊情况须加注释说明）。
- 样式仅使用 **Tailwind CSS 工具类**，禁止行内 `style` 对象（动态颜色等例外须注释）。

### 3.3 数据类型

- 笔记与文件夹数据结构定义在 `src/types/note.ts`（`Note` / `Folder` / `ImportedNoteDraft`），不得在组件内重新定义同类型结构。
- 修改数据类型前须评估所有消费方的影响。

---

## 四、Markdown 渲染管线规则

1. **入口预处理**：所有 Markdown 字符串在送入 `react-markdown` 前，必须经过 `formatMarkdownSource()` 处理（CRLF 统一、连续空行压缩）。

2. **Mermaid 渲染路径**：Mermaid 图表由 `MermaidRenderer.tsx` 组件负责渲染，该组件直接调用 `mermaid.render()` 获取 SVG 字符串。`mermaid.initialize()` 在应用入口 `src/utils/mermaidInit.ts` 中调用一次，使用 `theme: 'base'` + `themeVariables` 完整覆盖样式。

3. **Mermaid Modal 预览**：`MermaidModal.tsx` 接收已渲染的 SVG 字符串直接展示，不重新调用 `mermaid.render()`，确保普通视图与 Modal 视觉一致。支持滚轮缩放（passive: false）与拖拽平移。

4. **rehype-raw**：启用了 HTML 片段解析，注意 XSS 风险——禁止在用户输入流之外插入未经过滤的 HTML 字符串。

---

## 五、持久化规范

1. 所有本地状态通过 `src/hooks/useLocalStorage.ts` 封装的 Hook 读写，**禁止** 在组件中直接调用 `localStorage.getItem/setItem`。

2. 存储 Key 命名需有语义前缀（如 `mdnote_notes`、`mdnote_folders`），避免与其他应用冲突。

3. 新增持久化字段须考虑向后兼容（旧数据缺少该字段时的默认值处理）。

---

## 六、移动端适配要求

1. 所有新增 UI 组件必须在 `md`（768px）断点下验证可用性。

2. 移动端侧栏为 fixed 抽屉模式（`md` 以下），新增侧栏交互须同步适配抽屉场景。

3. 拖拽功能须同时配置 `PointerSensor` 与 `TouchSensor`（含长按延迟与容差），防止移动端滚动误触。

4. 工具栏按钮在移动端须保持可点击的最小触控面积（≥ 44×44px）。

---

## 七、打印 / PDF 导出规范

1. 打印样式在 `src/index.css` 的 `@media print` 中定义，组件不得使用 JS 动态注入打印样式。

2. 含 Mermaid 图表的文档导出前，须等待 `useAsyncMarkdown` 管线完成及 `MermaidRenderer` 异步渲染就绪，**禁止** 直接触发打印而跳过等待逻辑。

3. 打印区域仅包含 Markdown 预览内容，工具栏、侧栏等 UI 元素须通过 `@media print` 的 `display: none` 隐藏，不得通过 JS 动态移除 DOM。

---

## 八、资源与配置规范

1. **静态资源**（Logo、二维码等图片）须通过 ESM `import` 引入（`import logo from '../../assets/logo.jpg'`），**禁止** 使用运行时字符串路径拼接，避免 Vercel 生产环境 404。

2. **作者/品牌信息**统一在 `src/config/author.ts` 中维护，**禁止** 在 UI 组件中硬编码作者名、GitHub 链接、二维码路径等信息。

3. 新增配置项须添加到对应配置文件（`author.ts` 或新建 `src/config/*.ts`），不得散落在业务组件中。

---

## 九、代码质量要求

1. **TypeScript 严格模式**：`tsconfig` 已启用严格检查，提交前须通过 `tsc -b` 无错误。

2. **无 `console.log` 残留**：调试日志须在合并前清理，仅保留有意义的 `console.warn` / `console.error`。

3. **组件职责单一**：单个组件文件不超过 400 行（不含类型定义），超出须拆分子组件或提取 Hook。

4. **Hooks 依赖数组**：`useEffect` / `useCallback` / `useMemo` 的依赖数组须完整，禁止用 `// eslint-disable-next-line` 屏蔽 exhaustive-deps 警告（有合理例外须注释说明原因）。

---

## 十、禁止事项速查

| ❌ 禁止 | ✅ 应该 |
|---------|---------|
| 直接 `import Prism from 'prismjs'` | `import Prism from '../prism-loader'` |
| 在组件内直接调用 `localStorage` | 使用 `useLocalStorage` Hook |
| 用字符串路径引用 `assets/` 下的图片 | ESM `import` 引入 |
| 使用 `rehype-mermaid` 或其他 rehype 插件渲染 Mermaid | 通过 `MermaidRenderer` 组件 + `mermaid.render()` |
| 在组件内重复调用 `mermaid.initialize()` | 仅在 `src/utils/mermaidInit.ts` 中调用一次 |
| 硬编码作者信息 | 引用 `src/config/author.ts` |
| 引入新 UI 库替换 Tailwind | 使用 Tailwind 工具类 |
| 使用 Class 组件 | 函数组件 + Hooks |
| 升降级 `prismjs` 版本 | 保持 1.29.0，含 `overrides` |
| 在 `@media print` 之外用 JS 控制打印样式 | 在 `src/index.css` 的 print 媒体查询中定义 |

---

*本文件应与项目技术文档（`TECH_STATUS.md` 或等效文档）同步更新。当技术栈或核心实现发生变更时，须同步修改本文件对应条目。*