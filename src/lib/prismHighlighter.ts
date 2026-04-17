import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import clike from 'react-syntax-highlighter/dist/esm/languages/prism/clike';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const registered = new Set<string>();

function registerLanguage(name: string, grammar: unknown) {
  if (registered.has(name)) {
    return;
  }
  SyntaxHighlighter.registerLanguage(name, grammar);
  registered.add(name);
}

registerLanguage('markdown', markdown);
registerLanguage('md', markdown);
registerLanguage('markup', markup);
registerLanguage('html', markup);
registerLanguage('xml', markup);
registerLanguage('css', css);
registerLanguage('clike', clike);
registerLanguage('javascript', javascript);
registerLanguage('js', javascript);
registerLanguage('jsx', jsx);
registerLanguage('typescript', typescript);
registerLanguage('ts', typescript);
registerLanguage('tsx', tsx);
registerLanguage('json', json);
registerLanguage('bash', bash);
registerLanguage('sh', bash);
registerLanguage('python', python);
registerLanguage('py', python);
registerLanguage('sql', sql);
registerLanguage('yaml', yaml);
registerLanguage('yml', yaml);

const aliasMap: Record<string, string> = {
  md: 'markdown',
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  yml: 'yaml'
};

export function resolvePrismLanguage(rawLanguage?: string): string | null {
  if (!rawLanguage) {
    return null;
  }
  const normalized = rawLanguage.toLowerCase();
  const mapped = aliasMap[normalized] ?? normalized;
  return registered.has(mapped) ? mapped : null;
}

export { SyntaxHighlighter, atomDark };
