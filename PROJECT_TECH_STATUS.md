# MDNote 项目技术现状总结

> 文档目的：记录当前稳定技术栈、已解决的关键问题与核心功能实现方式，便于后续维护与部署（如 Vercel）对照。

---

## 一、当前稳定的技术栈

| 维度 | 选型 | 说明 |
|------|------|------|
| **运行时** | React 18.3.x | 函数组件 + Hooks |
| **语言** | TypeScript 5.x | 严格类型，配合 `tsc -b` 与 Vite 构建 |
| **构建** | Vite 5.x | 开发 HMR、生产 Rollup 打包 |
| **样式** | Tailwind CSS 3.x + PostCSS + Autoprefixer | 响应式与暗色 UI |
| **排版** | `@tailwindcss/typography` | Markdown 预览区 `prose` 类 |
| **Markdown 解析** | `react-markdown` v9 + **`remark-gfm`** + **`remark-breaks`** + **`rehype-raw`** | GFM 表格等；换行宽容； fenced 外 HTML 片段解析（注意 XSS 面） |
| **正文预处理** | `src/utils/formatMarkdownSource.ts` | 统一 CRLF/LF，并将连续空行压缩为双换行后送入解析器 |
| **代码高亮** | **原生 Prism.js 1.29.0**（已移除 `react-syntax-highlighter`） | `Prism.highlight` + 按需 `import 'prismjs/components/...'`；预览与打印路径统一走同一套 Prism 实例 |
| **编辑器源码高亮** | `react-simple-code-editor` + Prism | 编辑区对 Markdown 源码做语法着色 |
| **图标** | `lucide-react` | 工具栏等 UI 图标 |
| **本地文件** | `browser-fs-access` | 支持多文件与文件夹递归导入 `.md` / `.txt` |
| **打印 / PDF** | `react-to-print` | 系统打印对话框，用户可「另存为 PDF」 |
| **持久化** | `LocalStorage` + 自封装 Hook | 笔记、文件夹树、展开状态、当前选中笔记、搜索词等 |

**Prism 单例与版本**

- 入口 `src/main.tsx`：`import './prism-loader'`，由 **`src/prism-loader.ts`** 统一加载 `prismjs` 核心、**按依赖顺序**注册各 `components` 语法包、主题 CSS，并在全部完成后执行 `window.Prism = Prism`。
- 业务中：`import Prism from '../prism-loader'`（或等价路径），与入口共用同一 bundle 与单例。
- **`prism-php` 必须在 `prism-markup-templating` 之后加载**，否则 hook 中会访问未定义的 `tokenizePlaceholders` 导致运行时错误。
- `package.json` 将 `prismjs` 固定为 **1.29.0**，并通过 **`overrides`** 将子依赖中的 `prismjs` 也统一到 **1.29.0**，避免与 `refractor` 等传递依赖出现多版本 Prism 并存。

---

## 三、核心功能现状

### 1. 笔记与编辑

- **侧栏**：笔记列表、搜索、关于作者、公众号等（设置面板已移除）。
- **笔记组织**：侧栏为 IDE 风格紧凑树形结构，支持文件夹嵌套、展开/收起、文件夹内空状态提示、笔记移动到目标文件夹。
- **主工作区**（`LiveMarkdownWorkspace`）：
  - **编辑模式**：`react-simple-code-editor` + Prism Markdown 高亮。
  - **阅读模式**：`react-markdown` + 原生 Prism 高亮代码块。
- **标题**：由内容或文件名推导；支持 Zen 等与侧栏面板联动。

### 2. 本地文件导入

- 使用 **`browser-fs-access`**：
  - `fileOpen({ multiple: true })` 支持批量导入文件；
  - `directoryOpen({ recursive: true })` 支持整文件夹递归导入（含子目录）。
- 导入过程使用 `Promise.all` 并行读取并统一走 `formatMarkdownSource` 预处理。
- 导入时会解析 `webkitRelativePath` 还原目录层级，自动创建文件夹节点并将笔记归档到对应文件夹。
- 重名笔记采用「标题 + 导入时间戳（必要时追加序号）」策略，避免覆盖已有内容。

### 3. PDF 导出（浏览器打印）

- 使用 **`react-to-print`**，打印目标为仅包含渲染后 Markdown 的区域（与 `@media print` 样式配合，隐藏工具栏、侧栏等）。
- 用户在系统打印对话框中选择 **「另存为 PDF」**（或 macOS 的「存储为 PDF」）即可导出。

### 4. 其他

- **复制**：可将当前笔记 Markdown 复制到剪贴板。
- **打印样式**：`src/index.css` 中 `@media print` 控制边距、分页、链接不追加 URL 等。

### 5. 首页 Dashboard 与版式

- **首页优先**：应用挂载时会强制清空当前选中笔记，默认展示 `WorkspaceDashboard`（即使本地有历史笔记）。
- **无当前笔记时**：`App.tsx` 中 **`WorkspaceDashboard`** 展示首页。
- **特性轮播**：`src/components/FeatureCarousel.tsx`，暗色卡片 + 透视/旋转切换、自动轮播、`lucide-react` 箭头与圆点指示；与标题区、底部三列卡片之间通过 **`z-index` + 限高 + `overflow-hidden`** 控制层级与留白，避免遮挡文案或挤压卡片。
- **阅读模式排版**：`LiveMarkdownWorkspace` / `Preview` 中 `prose` 区域 **限宽居中**、响应式水平内边距；`tailwind.config.ts` 与 `index.css` 中增强 **`prose-invert`** 下行距、段落节奏与代码块对比度（主题 **`prism-okaidia`**）。

### 6. 品牌与资源加载

- **Logo**：侧栏顶部由占位文本替换为真实 Logo（`assets/logo.jpg`），支持 hover 微交互与点击返回 Dashboard。
- **作者信息配置化**：作者/公众号/GitHub 信息改为 `src/config/author.ts` 静态配置，不再在 UI 中可编辑。
- **二维码资源**：二维码改为 ESM 资源导入（`import ... from '../../assets/qrcode.jpg'`）写入配置，避免 Vercel 生产环境路径 404。

---

## 四、目录与关键文件索引

| 路径 | 作用 |
|------|------|
| `src/main.tsx` | 应用入口；`import './prism-loader'` |
| `src/prism-loader.ts` | Prism 核心 + 语言包顺序加载 + 主题 + `window.Prism` |
| `src/utils/resolvePrismLanguage.ts` | 围栏语言别名、`coercePrismLanguage` 兜底 |
| `src/utils/formatMarkdownSource.ts` | 送入 `react-markdown` 前的轻量换行清洗 |
| `src/config/author.ts` | 作者品牌静态配置（作者、公众号、GitHub、二维码） |
| `src/vite-env.d.ts` | `vite/client` 类型（如 `import.meta.env`） |
| `src/App.tsx` | 路由级布局、笔记状态、Dashboard、首页轮播挂载点 |
| `src/components/FeatureCarousel.tsx` | 首页特性轮播（无第三方轮播库） |
| `src/components/LiveMarkdownWorkspace.tsx` | 编辑/阅读切换、批量导入（文件/文件夹）、导出 PDF、Markdown 插件与 Prism 代码块 |
| `src/components/Sidebar.tsx` | 侧栏导航、紧凑树形文件夹/笔记结构与作者/公众号面板 |
| `src/components/Preview.tsx` | 独立预览中的 Markdown + Prism |
| `src/hooks/useLocalStorage.ts` | 本地存储封装 |
| `src/types/note.ts` | 笔记与文件夹数据模型（`Note` / `Folder` / `ImportedNoteDraft`） |
| `vite.config.ts` | Vite 与依赖预构建（如 `optimizeDeps` 含 `prismjs`） |
| `tailwind.config.ts` | Tailwind + typography（含 `invert` 下 pre/段落微调） |
| `package.json` | 依赖与 `prismjs` overrides |



*文档生成依据：当前仓库 `package.json` 与 `src` 下实现；若代码有变更，请同步更新本文档。*
