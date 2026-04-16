import { useMemo } from 'react';

interface EditorProps {
  noteTitle: string;
  value: string;
  onChange: (value: string) => void;
  zenMode?: boolean;
}

function Editor({ noteTitle, value, onChange, zenMode = false }: EditorProps) {
  const stats = useMemo(() => {
    const lines = value.length === 0 ? 1 : value.split('\n').length;
    const characters = value.replace(/\n/g, '').length;
    const words = value.trim().length === 0 ? 0 : value.trim().split(/\s+/).length;

    return { lines, characters, words };
  }, [value]);

  return (
    <section className="flex h-full min-h-0 flex-col border-l border-[#161b22] bg-[#0b1017]">
      <div className="border-b border-[#202833] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              {zenMode ? 'Zen Writing' : 'Editor'}
            </p>
            <h2 className="mt-1 line-clamp-1 text-base font-semibold text-slate-100">{noteTitle}</h2>
          </div>
          <div className="hidden rounded-full border border-[#253243] bg-[#0a1017] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-400 lg:block">
            Markdown
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-5 py-5">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-h-[320px] w-full resize-none rounded-[28px] border border-[#202833] bg-[#070c12] p-5 font-mono text-sm leading-7 text-slate-200 outline-none transition focus:border-[#3b82f6]"
          placeholder="在这里输入 Markdown 内容..."
        />
      </div>
      <div className="border-t border-[#202833] px-5 py-3 text-xs text-slate-500">
        行 {stats.lines} · 字符 {stats.characters} · 单词 {stats.words}
      </div>
    </section>
  );
}

export default Editor;
