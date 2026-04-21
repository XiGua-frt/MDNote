/**
 * 送入 react-markdown 前的轻量清洗：统一换行并压缩过长空行。
 * 表格与其它块级结构交由 remark-gfm、remark-breaks 与 rehype-raw 解析。
 */
export function formatMarkdownSource(source: string): string {
  return source.replace(/\r\n|\r/g, '\n').replace(/\n{3,}/g, '\n\n');
}
