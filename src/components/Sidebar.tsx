import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode, SVGProps } from 'react';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  ChevronDown,
  ChevronRight,
  Edit3,
  FilePlus,
  FileText,
  Folder as FolderIcon,
  FolderOpen,
  FolderPlus,
  FolderInput,
  Trash2
} from 'lucide-react';
import type { AuthorProfile } from '../types/authorProfile';
import type { Folder, Note } from '../types/note';
import logoImage from '../../assets/logo.jpg';

const DRAG_NOTE_PREFIX = 'note::';
const DROP_FOLDER_PREFIX = 'folder::';

interface DraggableNoteRowProps {
  noteId: string;
  children: (args: { isDragging: boolean; dragHandleProps: Record<string, unknown> }) => ReactNode;
}

function DraggableNoteRow({ noteId, children }: DraggableNoteRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${DRAG_NOTE_PREFIX}${noteId}`
  });
  const dragHandleProps = {
    ...attributes,
    ...listeners
  } as Record<string, unknown>;
  return (
    <div
      ref={setNodeRef}
      className={isDragging ? 'opacity-40' : ''}
      style={{ touchAction: 'none' }}
    >
      {children({ isDragging, dragHandleProps })}
    </div>
  );
}

interface DroppableFolderShellProps {
  folderId: string;
  disabled?: boolean;
  children: (args: { isOver: boolean }) => ReactNode;
}

function DroppableFolderShell({ folderId, disabled, children }: DroppableFolderShellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${DROP_FOLDER_PREFIX}${folderId}`,
    disabled
  });
  return <div ref={setNodeRef}>{children({ isOver })}</div>;
}

export type SidebarPanel = 'notes' | 'search' | 'author' | 'wechat' | null;

interface SidebarProps {
  notes: Note[];
  folders: Folder[];
  expandedFolders: Record<string, boolean>;
  searchResults: Note[];
  activeNoteId: string | null;
  searchKeyword: string;
  authorProfile: AuthorProfile;
  activePanel: SidebarPanel;
  onPanelChange: (panel: SidebarPanel) => void;
  onSearchChange: (value: string) => void;
  onCreateNote: () => void;
  onSelectNote: (noteId: string | null) => void;
  onDeleteNote: (noteId: string) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onRenameFolder: (folderId: string, nextName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onMoveNoteToFolder: (noteId: string, folderId: string | null) => void;
  onNavigateHome?: () => void;
}

type FolderEditingDraft =
  | { mode: 'create'; parentId: string | null }
  | { mode: 'rename'; folderId: string; initialName: string };

interface FolderTreeNode {
  folder: Folder;
  children: FolderTreeNode[];
  notes: Note[];
}

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

interface NavButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: JSX.Element;
}

interface PanelHeaderProps {
  title: string;
  description: string;
  onClose: () => void;
}

const WECHAT_TITLES = [
  '如何用 500 行代码跑通 RAG？',
  'Agentic Workflow 为什么比多轮 Prompt 更稳定？',
  'React + TypeScript 项目里如何做知识注入？',
  '结构化文档切块，才是 RAG 命中率的关键。'
];

function NotesIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    >
      <path d="M7 4.75h10A2.25 2.25 0 0 1 19.25 7v10A2.25 2.25 0 0 1 17 19.25H7A2.25 2.25 0 0 1 4.75 17V7A2.25 2.25 0 0 1 7 4.75Z" />
      <path d="M8.5 9h7M8.5 12h7M8.5 15h4.5" />
    </svg>
  );
}

function SearchIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    >
      <circle cx="11" cy="11" r="5.75" />
      <path d="m16 16 3.75 3.75" />
    </svg>
  );
}

function UserIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 12.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
      <path d="M5.5 19c1.2-2.9 3.45-4.5 6.5-4.5s5.3 1.6 6.5 4.5" />
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
    </svg>
  );
}

function WeChatIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    >
      <path d="M9.6 5.4c-3.88 0-6.85 2.52-6.85 5.83 0 1.7.8 3.25 2.18 4.32L4.3 18.2l2.9-1.55c.75.16 1.53.24 2.4.24 3.88 0 6.84-2.53 6.84-5.83S13.48 5.4 9.6 5.4Z" />
      <path d="M15.5 10.9c3.17 0 5.75 2.08 5.75 4.65 0 1.32-.7 2.54-1.85 3.41l.42 2.02-2.15-1.16c-.45.08-.91.12-1.39.12-3.17 0-5.74-2.08-5.74-4.65s2.57-4.38 5.7-4.38Z" />
      <path d="M7.25 10.55h.01M11.15 10.55h.01M14.9 15.15h.01M17.9 15.15h.01" />
    </svg>
  );
}

function GitHubIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    >
      <path d="M9 18c-4.5 1.4-4.5-2.2-6-2.7m12 5.4v-3.5a3.06 3.06 0 0 0-.85-2.38c2.85-.32 5.85-1.4 5.85-6.32A4.94 4.94 0 0 0 18.6 5a4.6 4.6 0 0 0-.08-3.22S17.4 1.45 15 3.05a13.38 13.38 0 0 0-6 0C6.6 1.45 5.48 1.78 5.48 1.78A4.6 4.6 0 0 0 5.4 5 4.94 4.94 0 0 0 4 8.5c0 4.88 3 5.96 5.85 6.32A3.06 3.06 0 0 0 9 17.2v3.5" />
    </svg>
  );
}

function NavButton({ active, label, onClick, icon }: NavButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl border transition duration-200 ${
        active
          ? 'border-[#3b82f6] bg-[#132238] text-[#c7e0ff] shadow-[0_8px_24px_rgba(59,130,246,0.18)]'
          : 'border-transparent bg-transparent text-slate-500 hover:scale-110 hover:border-[#243244] hover:bg-[#0d1520] hover:text-slate-100'
      }`}
    >
      {icon}
      <span className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-[#30363d] bg-[#11161d] px-2 py-1 text-[11px] text-slate-200 shadow-lg group-hover:block">
        {label}
      </span>
    </button>
  );
}

function PanelHeader({ title, description, onClose }: PanelHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#202833] px-5 py-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full border border-[#30363d] px-2.5 py-1 text-xs text-slate-400 transition hover:border-slate-500 hover:text-slate-100"
      >
        Close
      </button>
    </div>
  );
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function Sidebar({
  notes,
  folders,
  expandedFolders,
  searchResults,
  activeNoteId,
  searchKeyword,
  authorProfile,
  activePanel,
  onPanelChange,
  onSearchChange,
  onCreateNote,
  onSelectNote,
  onDeleteNote,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleFolder,
  onMoveNoteToFolder,
  onNavigateHome
}: SidebarProps) {
  const [folderDraft, setFolderDraft] = useState<FolderEditingDraft | null>(null);
  const [folderDraftName, setFolderDraftName] = useState('');
  const [moveMenuNoteId, setMoveMenuNoteId] = useState<string | null>(null);
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const moveMenuRef = useRef<HTMLDivElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const rawId = String(event.active.id);
    if (rawId.startsWith(DRAG_NOTE_PREFIX)) {
      setDraggingNoteId(rawId.slice(DRAG_NOTE_PREFIX.length));
    }
  };

  const handleDragCancel = () => {
    setDraggingNoteId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingNoteId(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith(DRAG_NOTE_PREFIX) || !overId.startsWith(DROP_FOLDER_PREFIX)) return;
    const noteId = activeId.slice(DRAG_NOTE_PREFIX.length);
    const folderId = overId.slice(DROP_FOLDER_PREFIX.length);
    const note = notes.find((item) => item.id === noteId);
    if (!note) return;
    if (note.folderId === folderId) return;
    onMoveNoteToFolder(noteId, folderId);
  };

  useEffect(() => {
    if (folderDraft) {
      folderInputRef.current?.focus();
      folderInputRef.current?.select();
    }
  }, [folderDraft]);

  useEffect(() => {
    if (!moveMenuNoteId) return;
    const handleClickAway = (event: MouseEvent) => {
      if (!moveMenuRef.current?.contains(event.target as Node)) {
        setMoveMenuNoteId(null);
      }
    };
    window.addEventListener('mousedown', handleClickAway);
    return () => window.removeEventListener('mousedown', handleClickAway);
  }, [moveMenuNoteId]);

  const noteMetrics = useMemo(
    () => ({
      total: notes.length,
      recent: notes[0] ? formatDate(notes[0].updatedAt) : '--'
    }),
    [notes]
  );

  const folderTree = useMemo<{ roots: FolderTreeNode[]; rootNotes: Note[] }>(() => {
    const byParent = new Map<string | null, Folder[]>();
    folders.forEach((folder) => {
      const key = folder.parentId ?? null;
      const bucket = byParent.get(key) ?? [];
      bucket.push(folder);
      byParent.set(key, bucket);
    });
    const notesByFolder = new Map<string | null, Note[]>();
    notes.forEach((note) => {
      const key = note.folderId ?? null;
      const bucket = notesByFolder.get(key) ?? [];
      bucket.push(note);
      notesByFolder.set(key, bucket);
    });

    const sortFolders = (list: Folder[] = []) =>
      [...list].sort((a, b) => a.name.localeCompare(b.name, 'zh'));

    const buildNode = (folder: Folder): FolderTreeNode => ({
      folder,
      children: sortFolders(byParent.get(folder.id) ?? []).map(buildNode),
      notes: notesByFolder.get(folder.id) ?? []
    });

    return {
      roots: sortFolders(byParent.get(null) ?? []).map(buildNode),
      rootNotes: notesByFolder.get(null) ?? []
    };
  }, [folders, notes]);

  const folderPathOptions = useMemo(() => {
    const folderById = new Map<string, Folder>();
    folders.forEach((folder) => folderById.set(folder.id, folder));
    const buildPath = (folderId: string): string => {
      const segments: string[] = [];
      let cursor: Folder | undefined = folderById.get(folderId);
      while (cursor) {
        segments.unshift(cursor.name);
        cursor = cursor.parentId ? folderById.get(cursor.parentId) : undefined;
      }
      return segments.join(' / ');
    };
    return folders
      .map((folder) => ({ id: folder.id, label: buildPath(folder.id) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'zh'));
  }, [folders]);

  const openFolderCreator = (parentId: string | null) => {
    setFolderDraft({ mode: 'create', parentId });
    setFolderDraftName('');
  };

  const openFolderRenamer = (folder: Folder) => {
    setFolderDraft({ mode: 'rename', folderId: folder.id, initialName: folder.name });
    setFolderDraftName(folder.name);
  };

  const commitFolderDraft = () => {
    if (!folderDraft) return;
    const trimmed = folderDraftName.trim();
    if (folderDraft.mode === 'create') {
      if (trimmed) {
        onCreateFolder(trimmed, folderDraft.parentId);
      }
    } else if (trimmed && trimmed !== folderDraft.initialName) {
      onRenameFolder(folderDraft.folderId, trimmed);
    }
    setFolderDraft(null);
    setFolderDraftName('');
  };

  const cancelFolderDraft = () => {
    setFolderDraft(null);
    setFolderDraftName('');
  };

  const handleFolderInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitFolderDraft();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelFolderDraft();
    }
  };

  const handleLogoClick = () => {
    onSelectNote(null);
    onNavigateHome?.();
  };

  const renderQrCard = () => {
    if (authorProfile.wechatQrUrl.trim()) {
      return (
        <div className="mx-auto rounded-[28px] border border-[#30363d] bg-white p-4 shadow-2xl shadow-black/25">
          <img
            src={authorProfile.wechatQrUrl}
            alt={`${authorProfile.wechatTitle} 二维码`}
            className="mx-auto h-48 w-48 rounded-2xl object-cover"
          />
        </div>
      );
    }

    return (
      <div className="mx-auto rounded-[28px] border border-[#30363d] bg-[radial-gradient(circle_at_top,#1b2b1f_0%,#10161d_55%,#0b1117_100%)] p-4">
        <svg viewBox="0 0 120 120" className="mx-auto h-48 w-48 rounded-2xl bg-white p-4 text-slate-950">
          <rect x="8" y="8" width="30" height="30" rx="4" fill="currentColor" />
          <rect x="14" y="14" width="18" height="18" rx="2" fill="white" />
          <rect x="20" y="20" width="6" height="6" rx="1.5" fill="currentColor" />
          <rect x="82" y="8" width="30" height="30" rx="4" fill="currentColor" />
          <rect x="88" y="14" width="18" height="18" rx="2" fill="white" />
          <rect x="94" y="20" width="6" height="6" rx="1.5" fill="currentColor" />
          <rect x="8" y="82" width="30" height="30" rx="4" fill="currentColor" />
          <rect x="14" y="88" width="18" height="18" rx="2" fill="white" />
          <rect x="20" y="94" width="6" height="6" rx="1.5" fill="currentColor" />
          <rect x="48" y="16" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="60" y="16" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="48" y="28" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="72" y="40" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="84" y="40" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="96" y="40" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="40" y="52" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="52" y="52" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="64" y="52" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="88" y="52" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="40" y="64" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="76" y="64" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="40" y="76" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="52" y="76" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="88" y="76" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="52" y="88" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="64" y="88" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="76" y="88" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="100" y="88" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="52" y="100" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="76" y="100" width="8" height="8" rx="1.5" fill="currentColor" />
        </svg>
      </div>
    );
  };

  const renderNoteRow = (note: Note, depth: number) => {
    const isActive = note.id === activeNoteId;
    const paddingLeft = depth * 14 + 10;

    return (
      <DraggableNoteRow key={note.id} noteId={note.id}>
        {({ dragHandleProps }) => (
      <div
        className={`group relative flex items-center gap-1.5 rounded-md py-1 pr-2 text-sm transition ${
          isActive ? 'bg-white/10 text-slate-50' : 'text-slate-300 hover:bg-white/5'
        }`}
        style={{ paddingLeft }}
        {...(dragHandleProps as Record<string, unknown>)}
      >
        <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
        <button
          type="button"
          onClick={() => onSelectNote(isActive ? null : note.id)}
          className="min-w-0 flex-1 truncate text-left"
          title={note.title}
        >
          {note.title}
        </button>
        <div className="ml-1 hidden items-center gap-1 text-slate-500 group-hover:flex">
          <button
            type="button"
            aria-label="移动到文件夹"
            title="移动到文件夹"
            onClick={(event) => {
              event.stopPropagation();
              setMoveMenuNoteId((prev) => (prev === note.id ? null : note.id));
            }}
            className="rounded p-1 transition hover:bg-white/10 hover:text-slate-100"
          >
            <FolderInput className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="删除笔记"
            title="删除"
            onClick={(event) => {
              event.stopPropagation();
              onDeleteNote(note.id);
            }}
            className="rounded p-1 transition hover:bg-red-500/15 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        {moveMenuNoteId === note.id ? (
          <div
            ref={moveMenuRef}
            role="menu"
            className="absolute right-2 top-full z-30 mt-1 max-h-64 w-56 overflow-y-auto rounded-xl border border-[#30363d] bg-[#0b1220] p-1 shadow-xl shadow-black/50"
          >
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation();
                onMoveNoteToFolder(note.id, null);
                setMoveMenuNoteId(null);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-200 transition hover:bg-white/5"
            >
              <FolderIcon className="h-3.5 w-3.5 text-slate-500" />
              根目录
            </button>
            {folderPathOptions.length === 0 ? (
              <p className="px-2 py-1.5 text-[11px] text-slate-500">尚未创建文件夹</p>
            ) : (
              folderPathOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMoveNoteToFolder(note.id, option.id);
                    setMoveMenuNoteId(null);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition hover:bg-white/5 ${
                    note.folderId === option.id ? 'text-slate-50' : 'text-slate-200'
                  }`}
                >
                  <FolderIcon className="h-3.5 w-3.5 text-slate-500" />
                  <span className="truncate">{option.label}</span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
        )}
      </DraggableNoteRow>
    );
  };

  const renderFolderRow = (node: FolderTreeNode, depth: number) => {
    const isExpanded = expandedFolders[node.folder.id] ?? false;
    const isRenaming = folderDraft?.mode === 'rename' && folderDraft.folderId === node.folder.id;
    const paddingLeft = depth * 14 + 4;
    const totalChildren = node.children.length + node.notes.length;
    const isDndActive = draggingNoteId !== null;
    const draggingNote = isDndActive
      ? notes.find((item) => item.id === draggingNoteId) ?? null
      : null;
    const dropDisabled =
      !isDndActive || (draggingNote !== null && draggingNote.folderId === node.folder.id);

    return (
      <div key={node.folder.id}>
        <DroppableFolderShell folderId={node.folder.id} disabled={dropDisabled}>
          {({ isOver }) => (
        <div
          className={`group flex items-center gap-1 rounded-md py-1 pr-2 text-sm text-slate-200 transition ${
            isOver
              ? 'border border-[#3b82f6] bg-[#132238]/80 text-slate-50 shadow-[0_0_0_1px_rgba(59,130,246,0.45)]'
              : 'border border-transparent hover:bg-white/5'
          }`}
          style={{ paddingLeft }}
        >
          <button
            type="button"
            onClick={() => onToggleFolder(node.folder.id)}
            aria-label={isExpanded ? '收起文件夹' : '展开文件夹'}
            className="rounded p-0.5 text-slate-500 transition hover:text-slate-100"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
          {isExpanded ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-300/80" aria-hidden="true" />
          ) : (
            <FolderIcon className="h-3.5 w-3.5 shrink-0 text-amber-300/80" aria-hidden="true" />
          )}
          {isRenaming ? (
            <input
              ref={folderInputRef}
              value={folderDraftName}
              onChange={(event) => setFolderDraftName(event.target.value)}
              onBlur={commitFolderDraft}
              onKeyDown={handleFolderInputKeyDown}
              className="min-w-0 flex-1 rounded border border-[#30363d] bg-[#0b1220] px-1.5 py-0.5 text-sm text-slate-100 outline-none focus:border-[#3b82f6]"
            />
          ) : (
            <button
              type="button"
              onClick={() => onToggleFolder(node.folder.id)}
              onDoubleClick={() => openFolderRenamer(node.folder)}
              className="min-w-0 flex-1 truncate text-left"
              title={node.folder.name}
            >
              {node.folder.name}
              <span className="ml-1.5 text-[11px] text-slate-500">{totalChildren || ''}</span>
            </button>
          )}
          {!isRenaming ? (
            <div className="ml-1 hidden items-center gap-1 text-slate-500 group-hover:flex">
              <button
                type="button"
                aria-label="在此新建子文件夹"
                title="新建子文件夹"
                onClick={(event) => {
                  event.stopPropagation();
                  openFolderCreator(node.folder.id);
                }}
                className="rounded p-1 transition hover:bg-white/10 hover:text-slate-100"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="重命名文件夹"
                title="重命名"
                onClick={(event) => {
                  event.stopPropagation();
                  openFolderRenamer(node.folder);
                }}
                className="rounded p-1 transition hover:bg-white/10 hover:text-slate-100"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="删除文件夹"
                title="删除（内部笔记会移到根目录）"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteFolder(node.folder.id);
                }}
                className="rounded p-1 transition hover:bg-red-500/15 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </div>
          )}
        </DroppableFolderShell>
        {isExpanded ? (
          <div>
            {folderDraft?.mode === 'create' && folderDraft.parentId === node.folder.id ? (
              <div
                className="flex items-center gap-1 rounded-md py-1 pr-2"
                style={{ paddingLeft: (depth + 1) * 14 + 10 }}
              >
                <FolderIcon className="h-3.5 w-3.5 shrink-0 text-amber-300/80" aria-hidden="true" />
                <input
                  ref={folderInputRef}
                  value={folderDraftName}
                  onChange={(event) => setFolderDraftName(event.target.value)}
                  onBlur={commitFolderDraft}
                  onKeyDown={handleFolderInputKeyDown}
                  placeholder="文件夹名"
                  className="min-w-0 flex-1 rounded border border-[#30363d] bg-[#0b1220] px-1.5 py-0.5 text-sm text-slate-100 outline-none focus:border-[#3b82f6]"
                />
              </div>
            ) : null}
            {node.children.map((child) => renderFolderRow(child, depth + 1))}
            {node.notes.map((note) => renderNoteRow(note, depth + 1))}
            {totalChildren === 0 && !(folderDraft?.mode === 'create' && folderDraft.parentId === node.folder.id) ? (
              <div
                className="py-1 text-[11px] italic text-slate-600"
                style={{ paddingLeft: (depth + 1) * 14 + 24 }}
              >
                （空文件夹）
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  const renderPanelContent = () => {
    if (activePanel === 'notes') {
      const isCreatingRootFolder =
        folderDraft?.mode === 'create' && folderDraft.parentId === null;
      const totalRootItems = folderTree.roots.length + folderTree.rootNotes.length;

      return (
        <>
          <PanelHeader
            title="笔记列表"
            description="树形结构，支持文件夹分组、导入继承目录层级。"
            onClose={() => onPanelChange(null)}
          />
          <div className="flex items-center justify-between border-b border-[#202833] px-3 py-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Library</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                共 {noteMetrics.total} 条 · {noteMetrics.recent}
              </p>
            </div>
            <div className="flex items-center gap-0.5 text-slate-400">
              <button
                type="button"
                aria-label="新建笔记"
                title="新建笔记"
                onClick={onCreateNote}
                className="rounded p-1.5 transition hover:bg-white/10 hover:text-slate-100"
              >
                <FilePlus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="新建文件夹"
                title="新建文件夹"
                onClick={() => openFolderCreator(null)}
                className="rounded p-1.5 transition hover:bg-white/10 hover:text-slate-100"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <DndContext
            sensors={dndSensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {isCreatingRootFolder ? (
                <div
                  className="flex items-center gap-1 rounded-md py-1 pr-2"
                  style={{ paddingLeft: 10 }}
                >
                  <FolderIcon
                    className="h-3.5 w-3.5 shrink-0 text-amber-300/80"
                    aria-hidden="true"
                  />
                  <input
                    ref={folderInputRef}
                    value={folderDraftName}
                    onChange={(event) => setFolderDraftName(event.target.value)}
                    onBlur={commitFolderDraft}
                    onKeyDown={handleFolderInputKeyDown}
                    placeholder="文件夹名"
                    className="min-w-0 flex-1 rounded border border-[#30363d] bg-[#0b1220] px-1.5 py-0.5 text-sm text-slate-100 outline-none focus:border-[#3b82f6]"
                  />
                </div>
              ) : null}
              {folderTree.roots.map((node) => renderFolderRow(node, 0))}
              {folderTree.rootNotes.map((note) => renderNoteRow(note, 0))}
              {totalRootItems === 0 && !isCreatingRootFolder ? (
                <div className="px-3 py-10 text-center text-xs text-slate-500">
                  暂无笔记，点击顶部「新建笔记」开始创作。
                </div>
              ) : null}
            </div>
          </DndContext>
        </>
      );
    }

    if (activePanel === 'search') {
      return (
        <>
          <PanelHeader
            title="搜索"
            description="同时匹配标题和正文，跨文件夹检索笔记。"
            onClose={() => onPanelChange(null)}
          />
          <div className="border-b border-[#202833] px-5 py-4">
            <input
              value={searchKeyword}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="搜索标题或正文..."
              className="w-full rounded-2xl border border-[#30363d] bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-slate-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {searchResults.length === 0 ? (
              <div className="mx-2 rounded-2xl border border-dashed border-[#30363d] px-4 py-10 text-center text-sm text-slate-400">
                没有找到匹配内容，试试正文关键字。
              </div>
            ) : (
              searchResults.map((note) => renderNoteRow(note, 0))
            )}
          </div>
        </>
      );
    }

    if (activePanel === 'author') {
      return (
        <>
          <PanelHeader
            title="关于作者"
            description="Agent 架构、RAG 项目与当前工作重点，都放在这一栏。"
            onClose={() => onPanelChange(null)}
          />
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <section className="rounded-3xl border border-[#30363d] bg-[#0c121a] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">开发者档案</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-100">{authorProfile.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{authorProfile.role}</p>
            </section>

            <section className="rounded-3xl border border-[#30363d] bg-[#0c121a] p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
                  Agent 架构图
                </h3>
                <button
                  type="button"
                  onClick={() => window.open(authorProfile.githubUrl || 'https://github.com', '_blank', 'noopener,noreferrer')}
                  className="inline-flex items-center gap-2 rounded-full border border-[#30363d] px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  <GitHubIcon />
                  查看详情
                </button>
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-[#1f334e] bg-[#0d1b2b] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">01 Planner</p>
                  <p className="mt-2 text-sm text-slate-100">任务规划、工具调度、状态管理</p>
                </div>
                <div className="ml-6 border-l border-dashed border-[#2d3a49] pl-4">
                  <div className="rounded-2xl border border-[#224338] bg-[#0f1f1b] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">02 Retriever</p>
                    <p className="mt-2 text-sm text-slate-100">结构化文档切块、语义召回、引用追踪</p>
                  </div>
                </div>
                <div className="ml-12 border-l border-dashed border-[#2d3a49] pl-4">
                  <div className="rounded-2xl border border-[#4b3317] bg-[#1b1712] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">03 Action Layer</p>
                    <p className="mt-2 text-sm text-slate-100">生成内容、执行工具、回写产物</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#30363d] bg-[#0c121a] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
                正在进行的项目
              </h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-[#202833] px-4 py-3">
                  🤖 AutoMedia: 自动化媒体流处理 Agent <span className="text-slate-500">(Coming Soon)</span>
                </div>
                <div className="rounded-2xl border border-[#202833] px-4 py-3">
                  🧠 RAG-Structure: 基于结构化文档的增强检索方案
                </div>
                <div className="rounded-2xl border border-[#202833] px-4 py-3">
                  ✍️ MDNote: 本项目 - 追求极致体验的 Markdown 工具
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#30363d] bg-[#0c121a] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">核心标签</h3>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-300">
                {['#LLM_Agents', '#RAG', '#IoT_Hardware', '#React_TS'].map((tag) => (
                  <span key={tag} className="rounded-full border border-[#253243] px-3 py-1.5">
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-[#30363d] bg-[#0c121a] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">关注我</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{authorProfile.bio}</p>
              <div className="mt-5 flex flex-col items-center gap-4 rounded-3xl border border-[#202833] bg-[#0a1017] px-4 py-5">
                {renderQrCard()}
                <p className="text-sm text-slate-200">公众号：{authorProfile.wechatTitle}</p>
              </div>
            </section>
          </div>
        </>
      );
    }

    if (activePanel === 'wechat') {
      return (
        <>
          <PanelHeader
            title="关注公众号"
            description="二维码配合近期内容标题滚动，形成更像产品而不是弹窗的展示。"
            onClose={() => onPanelChange(null)}
          />
          <div className="flex flex-1 flex-col justify-between gap-6 overflow-hidden px-5 py-6">
            <div className="flex w-full flex-col items-center justify-center space-y-4 text-center">
              <p className="text-sm text-slate-400">扫码获取 Agent、RAG 与工程化实践更新</p>
              {renderQrCard()}
              <p className="text-base font-medium text-slate-100">公众号：{authorProfile.wechatTitle}</p>
            </div>
            <div className="w-full overflow-hidden rounded-2xl border border-[#30363d] bg-[#0c121a] py-4">
              <div className="wechat-marquee whitespace-nowrap text-sm text-slate-300">
                {WECHAT_TITLES.concat(WECHAT_TITLES).map((title, index) => (
                  <span key={`${title}-${index}`} className="mx-4 inline-flex items-center gap-3">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#07c160]" />
                    {title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="print-hide flex h-full">
      <aside className="flex h-full w-16 shrink-0 flex-col items-center justify-between border-r border-[#161b22] bg-[#04070b] py-4">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            aria-label="返回首页"
            title="返回首页"
            onClick={handleLogoClick}
            className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#1e2632] bg-[#09111b] transition duration-200 hover:scale-105 hover:brightness-110"
          >
            <img src={logoImage} alt="MDNote Logo" className="h-8 w-auto object-contain" />
          </button>
          <NavButton
            active={activePanel === 'notes'}
            label="笔记列表"
            onClick={() => onPanelChange('notes')}
            icon={<NotesIcon />}
          />
          <NavButton
            active={activePanel === 'search'}
            label="搜索"
            onClick={() => onPanelChange('search')}
            icon={<SearchIcon />}
          />
          <NavButton
            active={activePanel === 'author'}
            label="关于作者"
            onClick={() => onPanelChange('author')}
            icon={<UserIcon />}
          />
          <NavButton
            active={activePanel === 'wechat'}
            label="关注公众号"
            onClick={() => onPanelChange('wechat')}
            icon={<WeChatIcon />}
          />
        </div>

        <div className="h-11 w-11" aria-hidden="true" />
      </aside>

      <div
        className={`overflow-hidden border-r border-[#161b22] transition-[width,opacity,transform] duration-300 ease-out ${
          activePanel ? 'w-[340px] opacity-100 translate-x-0' : 'w-0 -translate-x-4 opacity-0'
        }`}
      >
        <div className="flex h-full w-[340px] flex-col bg-[#0b1017]">
          {renderPanelContent()}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
