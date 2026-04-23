import { useEffect, useMemo, useState } from 'react';
import { Menu } from 'lucide-react';
import { AUTHOR_PROFILE } from './config/author';
import FeatureCarousel from './components/FeatureCarousel';
import LiveMarkdownWorkspace from './components/LiveMarkdownWorkspace';
import Sidebar from './components/Sidebar';
import useLocalStorage from './hooks/useLocalStorage';
import type { SidebarPanel } from './components/Sidebar';
import type { Folder, ImportedNoteDraft, Note } from './types/note';

const NOTES_STORAGE_KEY = 'mdnote-notes';
const ACTIVE_NOTE_STORAGE_KEY = 'mdnote-active-note-id';
const FOLDERS_STORAGE_KEY = 'mdnote-folders';
const EXPANDED_FOLDERS_STORAGE_KEY = 'mdnote-folder-expanded';

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

function formatImportTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
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

interface DashboardProps {
  notes: Note[];
  zenMode: boolean;
  onCreateNote: () => void;
  onSelectNote: (noteId: string) => void;
}

function WorkspaceDashboard({ notes, zenMode, onCreateNote, onSelectNote }: DashboardProps) {
  const recentNotes = notes.slice(0, 3);

  const latestNote = recentNotes[0];

  // 全局共享的水平容器：在 PC 端把 Hero / 轮播 / 卡片对齐到同一条 7xl 主轴。
  const sectionContainer = 'mx-auto w-full max-w-7xl';

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-none border-l border-[#161b22] bg-[radial-gradient(circle_at_top,#132034_0%,#0d1117_42%,#090c10_100%)]">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto px-4 pt-6 pb-20 md:px-10 md:py-8 lg:px-12 xl:px-16">
        <div className={`relative z-10 shrink-0 space-y-5 md:space-y-6 ${sectionContainer}`}>
          {/* 移动端为左上角 fixed 汉堡按钮预留 hit zone：徽章行整体右移，避免与 z-60 按钮重叠 */}
          <div className="flex flex-wrap items-center gap-3 pl-12 md:pl-0">
            <span className="rounded-full border border-[#30363d] bg-slate-950/70 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-slate-400">
              {zenMode ? 'Zen Mode' : 'Dashboard'}
            </span>
            <span className="text-sm text-slate-500">持久存储全屏创作</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="whitespace-nowrap text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl md:whitespace-normal md:text-5xl">
              执笔入定，让思绪结构化。
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 md:mt-4 md:text-base">
              这里是你的灵感庇护所，实时预览让内容即刻成型，语法高亮让逻辑清晰可见。在这里，每一行文字都拥有它应有的规范美感。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onCreateNote}
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#60a5fa_0%,#2563eb_100%)] px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 sm:px-5"
            >
              新建一条笔记
            </button>
            {latestNote ? (
              <button
                type="button"
                onClick={() => onSelectNote(latestNote.id)}
                className="inline-flex items-center justify-center rounded-full border border-[#30363d] bg-slate-950/70 px-4 py-2.5 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white sm:px-5"
              >
                <span className="sm:hidden">继续编辑</span>
                <span className="hidden sm:inline">打开最近一条</span>
              </button>
            ) : null}
          </div>
        </div>

        <div
          className={`relative isolate z-0 mt-4 flex shrink-0 flex-col items-center justify-center py-2 md:mt-10 md:py-6 lg:mt-12 lg:py-8 ${sectionContainer}`}
        >
          <FeatureCarousel />
        </div>

        <div
          className={`relative z-10 mt-2 grid shrink-0 grid-cols-1 gap-4 md:mt-0 lg:grid-cols-[1.15fr_0.85fr_1fr] ${sectionContainer}`}
        >
          <section className="rounded-3xl border border-[#30363d] bg-slate-950/55 p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between md:mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">最近编辑</h2>
              <span className="text-xs text-slate-500">{recentNotes.length} 条</span>
            </div>
            <div className="space-y-2 md:space-y-3">
              {recentNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onSelectNote(note.id)}
                  className="block w-full rounded-2xl border border-[#202833] bg-[#0e1620] px-3 py-2 text-left transition hover:border-[#3a4a60] hover:bg-[#101b27] md:px-4 md:py-3"
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

          <section className="hidden rounded-3xl border border-[#30363d] bg-slate-950/55 p-5 md:block">
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

          <section className="rounded-3xl border border-[#30363d] bg-slate-950/55 p-4 md:p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-300 md:mb-4">
              Agent 项目推荐
            </h2>
            <div className="space-y-2 md:space-y-3">
              {AGENT_PROJECTS.map((project) => (
                <article
                  key={project.name}
                  className="rounded-2xl border border-[#202833] bg-[#0e1620] px-3 py-2 md:px-4 md:py-3"
                >
                  <h3 className="text-sm font-medium text-slate-100">{project.name}</h3>
                  <p className="mt-2 hidden text-sm leading-6 text-slate-400 md:block">{project.description}</p>
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
  const [folders, setFolders] = useLocalStorage<Folder[]>(FOLDERS_STORAGE_KEY, []);
  const [expandedFolders, setExpandedFolders] = useLocalStorage<Record<string, boolean>>(
    EXPANDED_FOLDERS_STORAGE_KEY,
    {}
  );
  const [activeNoteId, setActiveNoteId] = useLocalStorage<string | null>(ACTIVE_NOTE_STORAGE_KEY, null);
  const [searchKeyword, setSearchKeyword] = useLocalStorage<string>('mdnote-search', '');
  const [activePanel, setActivePanel] = useState<SidebarPanel>('notes');
  const [hasMounted, setHasMounted] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  const effectiveActiveNoteId = hasMounted ? activeNoteId : null;
  const currentNote = notes.find((note) => note.id === effectiveActiveNoteId) ?? null;
  const zenMode = activePanel === null;

  useEffect(() => {
    // 每次进入应用首页时，默认回到 Dashboard，而不是自动打开历史笔记。
    setActiveNoteId(null);
    setHasMounted(true);
  }, [setActiveNoteId]);

  useEffect(() => {
    if (notes.length === 0) {
      const fallback = createDefaultNote();
      setNotes([fallback]);
      setActiveNoteId(null);
      return;
    }

    if (activeNoteId !== null && !notes.some((note) => note.id === activeNoteId)) {
      setActiveNoteId(notes[0]?.id ?? null);
    }
  }, [activeNoteId, notes, setActiveNoteId, setNotes]);

  const handleCreateNote = () => {
    const newNote = createDefaultNote();
    setNotes((prevNotes) => [newNote, ...prevNotes]);
    setActiveNoteId(newNote.id);
    setIsMobileSidebarOpen(false);
  };

  const handleDeleteNote = (noteId: string) => {
    const nextNotes = notes.filter((note) => note.id !== noteId);
    if (nextNotes.length === 0) {
      const fallback = createDefaultNote();
      setNotes([fallback]);
      setActiveNoteId(null);
      return;
    }

    setNotes(nextNotes);
    if (noteId === activeNoteId) {
      setActiveNoteId(null);
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

  const handleImportNotes = (drafts: ImportedNoteDraft[]) => {
    if (drafts.length === 0) return;

    const now = Date.now();
    const newFolders: Folder[] = [];
    const expandedAdditions: Record<string, boolean> = {};
    const folderIdByPath = new Map<string, string>();

    const buildPath = (folder: Folder): string => {
      const segments: string[] = [];
      let cursor: Folder | undefined = folder;
      while (cursor) {
        segments.unshift(cursor.name);
        cursor = folders.find((item) => item.id === cursor!.parentId);
      }
      return segments.join('/');
    };
    folders.forEach((folder) => {
      folderIdByPath.set(buildPath(folder), folder.id);
    });

    const ensureFolderPath = (segments: string[] | undefined): string | null => {
      if (!segments || segments.length === 0) return null;
      let parentId: string | null = null;
      const accum: string[] = [];
      for (const segment of segments) {
        accum.push(segment);
        const key = accum.join('/');
        let folderId = folderIdByPath.get(key);
        if (!folderId) {
          folderId = createId();
          newFolders.push({ id: folderId, name: segment, parentId, createdAt: now });
          folderIdByPath.set(key, folderId);
          expandedAdditions[folderId] = true;
        }
        parentId = folderId;
      }
      return parentId;
    };

    const buildTitleKey = (folderId: string | null, title: string) => `${folderId ?? ''}::${title}`;
    const existingTitles = new Set(
      notes.map((note) => buildTitleKey(note.folderId ?? null, note.title))
    );

    const createdNotes: Note[] = drafts.map((draft, index) => {
      const folderId = ensureFolderPath(draft.folderPath);
      let title = draft.title.slice(0, 40) || extractTitle(draft.content);
      if (existingTitles.has(buildTitleKey(folderId, title))) {
        // 避免覆盖同名笔记：拼接导入时间戳，若仍撞名再附加批量序号。
        const suffix = formatImportTimestamp(now);
        title = `${title}（导入 ${suffix}）`;
        if (existingTitles.has(buildTitleKey(folderId, title))) {
          title = `${title} #${index + 1}`;
        }
      }
      existingTitles.add(buildTitleKey(folderId, title));
      return {
        id: createId(),
        title,
        content: draft.content,
        updatedAt: now + index,
        folderId
      };
    });

    if (newFolders.length > 0) {
      setFolders((prev) => [...prev, ...newFolders]);
      setExpandedFolders((prev) => ({ ...prev, ...expandedAdditions }));
    }
    setNotes((prev) => [...createdNotes, ...prev]);
    setActiveNoteId(createdNotes[0].id);
  };

  const handleCreateFolder = (name: string, parentId: string | null) => {
    const safeName = name.trim() || '未命名文件夹';
    const newFolder: Folder = {
      id: createId(),
      name: safeName,
      parentId,
      createdAt: Date.now()
    };
    setFolders((prev) => [...prev, newFolder]);
    setExpandedFolders((prev) => ({ ...prev, [newFolder.id]: true }));
    if (parentId) {
      setExpandedFolders((prev) => ({ ...prev, [parentId]: true }));
    }
  };

  const handleRenameFolder = (folderId: string, nextName: string) => {
    const safeName = nextName.trim();
    if (!safeName) return;
    setFolders((prev) => prev.map((folder) => (folder.id === folderId ? { ...folder, name: safeName } : folder)));
  };

  const handleDeleteFolder = (folderId: string) => {
    // 收集所有后代文件夹 id（含自身），支持任意层级嵌套。
    const descendants = new Set<string>();
    const queue = [folderId];
    while (queue.length > 0) {
      const current = queue.shift() as string;
      descendants.add(current);
      folders.forEach((folder) => {
        if (folder.parentId === current) queue.push(folder.id);
      });
    }

    // 一并收集会被级联删除的笔记 id，便于事后判定 activeNoteId 是否需要重置。
    const deletedNoteIds = new Set<string>();
    notes.forEach((note) => {
      if (note.folderId && descendants.has(note.folderId)) {
        deletedNoteIds.add(note.id);
      }
    });

    setFolders((prev) => prev.filter((folder) => !descendants.has(folder.id)));
    setNotes((prev) => {
      const next = prev.filter((note) => !deletedNoteIds.has(note.id));
      if (next.length === 0) {
        // 维持「至少有一条笔记」的不变量，避免 useEffect 反复生成默认笔记。
        return [createDefaultNote()];
      }
      return next;
    });
    setExpandedFolders((prev) => {
      const next = { ...prev };
      descendants.forEach((id) => {
        delete next[id];
      });
      return next;
    });

    // 当前选中笔记如果在被级联删除范围内，回到 Dashboard。
    if (activeNoteId && deletedNoteIds.has(activeNoteId)) {
      setActiveNoteId(null);
    }
  };

  const handleToggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleMoveNoteToFolder = (noteId: string, folderId: string | null) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === noteId ? { ...note, folderId, updatedAt: Date.now() } : note))
    );
    if (folderId) {
      setExpandedFolders((prev) => ({ ...prev, [folderId]: true }));
    }
  };

  const handlePanelChange = (panel: SidebarPanel) => {
    setActivePanel((prevPanel) => {
      const next = prevPanel === panel ? null : panel;
      // 移动端：点掉当前面板（变为 null）时同步收起抽屉，避免只剩一条 64px 的空壳。
      if (next === null) setIsMobileSidebarOpen(false);
      return next;
    });
  };

  const handleSelectNote = (noteId: string | null) => {
    setActiveNoteId(noteId);
    // 移动端：选中笔记后自动收起抽屉，让出工作区。
    if (noteId) setIsMobileSidebarOpen(false);
  };

  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);
  const openMobileSidebar = () => setIsMobileSidebarOpen(true);

  return (
    <main className="app-shell h-screen overflow-hidden bg-[#05080d] text-slate-100">
      {!isMobileSidebarOpen ? (
        <button
          type="button"
          aria-label="打开侧栏"
          onClick={openMobileSidebar}
          className="print-hide pointer-events-auto fixed left-2 top-2 z-[60] inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#202833] bg-[#0b1017]/90 p-2 text-slate-300 shadow-lg shadow-black/30 backdrop-blur transition hover:border-slate-500 hover:text-white md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      ) : null}
      <div className="flex h-full min-h-0">
        <Sidebar
          notes={orderedNotes}
          folders={folders}
          expandedFolders={expandedFolders}
          searchResults={filteredNotes}
          activeNoteId={activeNoteId}
          searchKeyword={searchKeyword}
          authorProfile={AUTHOR_PROFILE}
          activePanel={activePanel}
          onPanelChange={handlePanelChange}
          onSearchChange={setSearchKeyword}
          onCreateNote={handleCreateNote}
          onSelectNote={handleSelectNote}
          onDeleteNote={handleDeleteNote}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onToggleFolder={handleToggleFolder}
          onMoveNoteToFolder={handleMoveNoteToFolder}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={closeMobileSidebar}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          {currentNote ? (
            <div className="h-full min-h-0">
              <LiveMarkdownWorkspace
                noteTitle={currentNote.title}
                value={currentNote.content}
                onChange={handleContentChange}
                onImportNotes={handleImportNotes}
                zenMode={zenMode}
              />
            </div>
          ) : (
            <WorkspaceDashboard
              notes={orderedNotes}
              zenMode={zenMode}
              onCreateNote={handleCreateNote}
              onSelectNote={(noteId) => handleSelectNote(noteId)}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
