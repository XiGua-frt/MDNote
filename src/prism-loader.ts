/**
 * 单入口加载 Prism：导入顺序决定 extend / hooks 依赖是否就绪。
 * prism-php 在 before/after-tokenize 中调用 markup-templating 的 API，必须先加载 prism-markup-templating。
 */
import Prism from 'prismjs';

// --- 核心基础（必须先于 extend 与 markup-templating 相关语言）---
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';

// --- C 系：cpp extends c ---
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

// --- JavaScript / TypeScript 栈 ---
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';

// --- 数据、配置、Shell ---
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-ini';
import 'prismjs/components/prism-toml';

// --- 常用语言 ---
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-fsharp';
import 'prismjs/components/prism-basic';
import 'prismjs/components/prism-vbnet';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-ruby';

// --- 依赖 markup-templating（必须在 prism-markup-templating 之后）---
import 'prismjs/components/prism-php';

// --- Markdown 源码高亮（编辑器 / 文档）---
import 'prismjs/components/prism-markdown';

// --- 其它 ---
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-diff';
import 'prismjs/components/prism-shell-session';

// --- 主题（仅样式，须在 Prism 与语言注册完成之后加载）---
import 'prismjs/themes/prism-okaidia.css';

if (typeof window !== 'undefined') {
  (window as Window & { Prism?: typeof Prism }).Prism = Prism;
}

export default Prism;
export { Prism };
