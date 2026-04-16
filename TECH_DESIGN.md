## 🛠 技术选型 (Tech Stack)

本项目采用现代前端开发工具链，旨在构建一个高性能、类型安全且易于维护的 Markdown 编辑器。

### 核心框架与工具
| 维度 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **构建工具** | **Vite** | 提供极速的热更新 (HMR) 和优化的构建性能 |
| **视图框架** | **React 18** | 基于组件化的开发模式，方便管理编辑器与预览区的状态同步 |
| **编程语言** | **TypeScript** | 提供静态类型检查，提升代码健壮性及开发时的自动补全体验 |
| **样式方案** | **Tailwind CSS** | 实用优先的 CSS 框架，用于快速构建响应式及双栏布局 |

### Markdown 处理
* **解析引擎**：`react-markdown` 
    * *特点*：基于插件系统（remark/rehype），高度可定制且渲染安全。
* **语法高亮**：`react-syntax-highlighter`
    * *特点*：支持多种高亮主题（如 Atom One Dark），能完美集成至 React 组件中。

### 数据与状态
* **持久化方案**：`LocalStorage`
    * *实现*：通过封装 `JSON.parse/stringify` 实现笔记数据的本地存储。
* **状态管理**：React Hooks (`useState`, `useEffect`)
    * *逻辑*：通过副作用钩子实时监听编辑器变化并同步至本地缓存。

---

### 📦 核心依赖参考 (package.json)
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-markdown": "^9.x",
    "react-syntax-highlighter": "^15.x",
    "tailwindcss": "^3.x",
    "typescript": "^5.x"
  }
}