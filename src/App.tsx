import { useEffect, useMemo, useRef, useState } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Sidebar from './components/Sidebar';
import useLocalStorage from './hooks/useLocalStorage';
import type { SidebarPanel } from './components/Sidebar';
import type { AuthorProfile } from './types/authorProfile';
import type { Note } from './types/note';

const NOTES_STORAGE_KEY = 'mdnote-notes';
const ACTIVE_NOTE_STORAGE_KEY = 'mdnote-active-note-id';
const AUTHOR_PROFILE_STORAGE_KEY = 'mdnote-author-profile';
const WORKSPACE_RATIO_STORAGE_KEY = 'mdnote-workspace-ratio';

const INITIAL_MARKDOWN = `# MDNote

欢迎使用 Markdown 编辑器。

\`\`\`tsx
function greet(name: string) {
  return 'Hello, ' + name + '!';
}
\`\`\`
`;

const DASHBOARD_SHORTCUTS = [
  { key: 'Cmd/Ctrl + K', label: '快速聚焦到搜索面板' },
  { key: 'Cmd/Ctrl + B', label: '切换侧边功能面板' },
  { key: 'Tab', label: '在编辑器与预览区之间切换注意力' }
];

const AGENT_PROJECTS = [
  {
    name: 'AutoMedia',
    description: '自动化媒体流处理 Agent，负责脚本编排、内容生成与分发。'
  },
  {
    name: 'RAG-Structure',
    description: '基于结构化文档的增强检索方案，强调块级引用与语义回溯。'
  },
  {
    name: 'MDNote',
    description: '追求极致空间利用率与沉浸感的 Markdown 工作台。'
  }
];

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function extractTitle(content: string): string {
  const firstNonEmptyLine = content
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstNonEmptyLine) {
    return '未命名笔记';
  }

  return firstNonEmptyLine.replace(/^#+\s*/, '').slice(0, 40) || '未命名笔记';
}

function createDefaultNote(): Note {
  const now = Date.now();
  return {
    id: createId(),
    title: '新笔记',
    content: INITIAL_MARKDOWN,
    updatedAt: now
  };
}

function createDefaultAuthorProfile(): AuthorProfile {
  return {
    name: 'Wu Wenbo (吴文博)',
    role: 'AI Agent 工程师',
    bio: '这里不只有代码，还有我对 Agentic Workflow 的深度思考。',
    wechatTitle: '你的公众号名称',
    wechatQrUrl: '',
    githubUrl: 'https://github.com'
  };
}

function clampRatio(value: number): number {
  return Math.min(0.72, Math.max(0.28, value));
}

interface DashboardProps {
  notes: Note[];
  zenMode: boolean;
  onCreateNote: () => void;
  onSelectNote: (noteId: string) => void;
}

function WorkspaceDashboard({ notes, zenMode, onCreateNote, onSelectNote }: DashboardProps) {
  const recentNotes = notes.slice(0, 3);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-none border-l border-[#161b22] bg-[radial-gradient(circle_at_top,#132034_0%,#0d1117_42%,#090c10_100%)]">
      <div className="flex flex-1 flex-col justify-between gap-8 overflow-y-auto px-6 py-8 md:px-10">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#30363d] bg-slate-950/70 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-slate-400">
              {zenMode ? 'Zen Mode' : 'Dashboard'}
            </span>
            <span className="text-sm text-slate-500">整个工作区已经释放到全高布局</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-100 md:text-5xl">
              没有选中笔记时，这里应该是一块有信息密度的工作台。
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
              现在你可以在最近编辑、快捷键和 Agent 项目之间快速切换，而不是面对空白页面。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onCreateNote}
              className="rounded-full bg-[linear-gradient(135deg,#60a5fa_0%,#2563eb_100%)] px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
            >
              新建一条笔记
            </button>
            {recentNotes[0] ? (
              <button
                type="button"
                onClick={() => onSelectNote(recentNotes[0].id)}
                className="rounded-full border border-[#30363d] bg-slate-950/70 px-5 py-2.5 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white"
              >
                打开最近一条
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr_1fr]">
          <section className="rounded-3xl border border-[#30363d] bg-slate-950/55 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">最近编辑</h2>
              <span className="text-xs text-slate-500">{recentNotes.length} 条</span>
            </div>
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onSelectNote(note.id)}
                  className="block w-full rounded-2xl border border-[#202833] bg-[#0e1620] px-4 py-3 text-left transition hover:border-[#3a4a60] hover:bg-[#101b27]"
                >
                  <p className="truncate text-sm font-medium text-slate-100">{note.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(note.updatedAt).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#30363d] bg-slate-950/55 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">快捷键提示</h2>
            <div className="space-y-3">
              {DASHBOARD_SHORTCUTS.map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="rounded-2xl border border-[#202833] bg-[#0e1620] px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{shortcut.key}</p>
                  <p className="mt-2 text-sm text-slate-200">{shortcut.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#30363d] bg-slate-950/55 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
              Agent 项目推荐
            </h2>
            <div className="space-y-3">
              {AGENT_PROJECTS.map((project) => (
                <article
                  key={project.name}
                  className="rounded-2xl border border-[#202833] bg-[#0e1620] px-4 py-3"
                >
                  <h3 className="text-sm font-medium text-slate-100">{project.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{project.description}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [notes, setNotes] = useLocalStorage<Note[]>(NOTES_STORAGE_KEY, [createDefaultNote()]);
  const [activeNoteId, setActiveNoteId] = useLocalStorage<string | null>(ACTIVE_NOTE_STORAGE_KEY, null);
  const [searchKeyword, setSearchKeyword] = useLocalStorage<string>('mdnote-search', '');
  const [authorProfile, setAuthorProfile] = useLocalStorage<AuthorProfile>(
    AUTHOR_PROFILE_STORAGE_KEY,
    createDefaultAuthorProfile()
  );
  const [workspaceRatio, setWorkspaceRatio] = useLocalStorage<number>(
    WORKSPACE_RATIO_STORAGE_KEY,
    0.5
  );
  const [activePanel, setActivePanel] = useState<SidebarPanel>('notes');
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  const orderedNotes = useMemo(
    () => [...notes].sort((a, b) => b.updatedAt - a.updatedAt),
    [notes]
  );

  const filteredNotes = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) {
      return orderedNotes;
    }

    return orderedNotes.filter((note) => {
      const title = note.title.toLowerCase();
      const content = note.content.toLowerCase();

      return title.includes(keyword) || content.includes(keyword);
    });
  }, [orderedNotes, searchKeyword]);

  const currentNote = notes.find((note) => note.id === activeNoteId) ?? null;
  const zenMode = activePanel === null;

  useEffect(() => {
    if (notes.length === 0) {
      const fallback = createDefaultNote();
      setNotes([fallback]);
      setActiveNoteId(fallback.id);
      return;
    }

    if (activeNoteId !== null && !notes.some((note) => note.id === activeNoteId)) {
      setActiveNoteId(notes[0]?.id ?? null);
    }
  }, [activeNoteId, notes, setActiveNoteId, setNotes]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const container = workspaceRef.current;
      if (!container) {
        return;
      }

      const bounds = container.getBoundingClientRect();
      const nextRatio = clampRatio((event.clientX - bounds.left) / bounds.width);
      setWorkspaceRatio(nextRatio);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setWorkspaceRatio]);

  const handleCreateNote = () => {
    const newNote = createDefaultNote();
    setNotes((prevNotes) => [newNote, ...prevNotes]);
    setActiveNoteId(newNote.id);
  };

  const handleDeleteNote = (noteId: string) => {
    const nextNotes = notes.filter((note) => note.id !== noteId);
    if (nextNotes.length === 0) {
      const fallback = createDefaultNote();
      setNotes([fallback]);
      setActiveNoteId(fallback.id);
      return;
    }

    setNotes(nextNotes);
    if (noteId === activeNoteId) {
      setActiveNoteId(nextNotes[0]?.id ?? null);
    }
  };

  const handleContentChange = (value: string) => {
    if (!currentNote) {
      return;
    }

    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === currentNote.id
          ? {
              ...note,
              content: value,
              title: extractTitle(value),
              updatedAt: Date.now()
            }
          : note
      )
    );
  };

  const handlePanelChange = (panel: SidebarPanel) => {
    setActivePanel((prevPanel) => (prevPanel === panel ? null : panel));
  };

  return (
    <main className="h-screen overflow-hidden bg-[#05080d] text-slate-100">
      <div className="flex h-full min-h-0">
        <Sidebar
          notes={orderedNotes}
          searchResults={filteredNotes}
          activeNoteId={activeNoteId}
          searchKeyword={searchKeyword}
          authorProfile={authorProfile}
          activePanel={activePanel}
          onPanelChange={handlePanelChange}
          onSearchChange={setSearchKeyword}
          onCreateNote={handleCreateNote}
          onSelectNote={setActiveNoteId}
          onDeleteNote={handleDeleteNote}
          onAuthorProfileChange={setAuthorProfile}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          {currentNote ? (
            <div ref={workspaceRef} className="flex h-full min-h-0 flex-col md:flex-row">
              <div
                className="min-h-0 md:h-full"
                style={{ width: `calc(${workspaceRatio * 100}% - 4px)` }}
              >
                <Editor
                  noteTitle={currentNote.title}
                  value={currentNote.content}
                  onChange={handleContentChange}
                  zenMode={zenMode}
                />
              </div>
              <button
                type="button"
                aria-label="拖拽调整编辑器与预览区宽度"
                onMouseDown={() => setIsResizing(true)}
                className="hidden w-2 shrink-0 cursor-col-resize border-l border-r border-[#1d2430] bg-[#0b1018] transition hover:bg-[#111824] md:block"
              >
                <span className="mx-auto block h-14 w-[3px] rounded-full bg-slate-700" />
              </button>
              <div className="min-h-0 flex-1">
                <Preview content={currentNote.content} zenMode={zenMode} />
              </div>
            </div>
          ) : (
            <WorkspaceDashboard
              notes={orderedNotes}
              zenMode={zenMode}
              onCreateNote={handleCreateNote}
              onSelectNote={(noteId) => setActiveNoteId(noteId)}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
