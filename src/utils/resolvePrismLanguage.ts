import Prism from '../prism-loader';

/**
 * 将 fence 语言标识规范为 Prism 注册的 grammar 名称，并补充常用别名。
 */
const ALIASES: Record<string, string> = {
  // docs / generic
  md: 'markdown',
  markdown: 'markdown',
  txt: 'markup',
  text: 'markup',
  plaintext: 'markup',
  xml: 'markup',
  html: 'markup',
  svg: 'markup',
  mathml: 'markup',
  // JS 系
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  node: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  // Python / shell
  py: 'python',
  pyw: 'python',
  ipython: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  ksh: 'bash',
  // C 系
  cpp: 'cpp',
  cxx: 'cpp',
  cc: 'cpp',
  hpp: 'cpp',
  hh: 'cpp',
  hxx: 'cpp',
  'c++': 'cpp',
  h: 'c',
  // JVM / .NET
  java: 'java',
  kt: 'kotlin',
  kts: 'kotlin',
  cs: 'csharp',
  csharp: 'csharp',
  fs: 'fsharp',
  vb: 'vbnet',
  // 其它语言
  rs: 'rust',
  rust: 'rust',
  go: 'go',
  golang: 'go',
  rb: 'ruby',
  ruby: 'ruby',
  jruby: 'ruby',
  php: 'php',
  swift: 'swift',
  yml: 'yaml',
  jsonc: 'json',
  dockerfile: 'docker',
  gql: 'graphql',
  patch: 'diff',
  // 无独立 grammar 时走 markup 兜底（由调用方再映射到 Prism.languages）
  vue: 'markup',
  svelte: 'markup'
};

export function resolvePrismLanguage(rawLanguage?: string): string {
  if (!rawLanguage?.trim()) {
    return 'markup';
  }
  const key = rawLanguage.toLowerCase().trim();
  return ALIASES[key] ?? key;
}

/**
 * 若 Prism 尚未注册该语言（或加载顺序异常），退回 markup，避免 highlight 阶段抛错。
 */
export function coercePrismLanguage(canonical: string): string {
  const lang = canonical.trim() || 'markup';
  const registered = Prism.languages[lang as keyof typeof Prism.languages];
  if (registered && typeof registered === 'object') {
    return lang;
  }
  if (lang !== 'markup') {
    console.warn('Missing Prism language pack:', lang);
  }
  return 'markup';
}
