import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, SVGProps } from 'react';
import type { AuthorProfile } from '../types/authorProfile';
import type { Note } from '../types/note';

export type SidebarPanel = 'notes' | 'search' | 'author' | 'wechat' | 'settings' | null;

interface SidebarProps {
  notes: Note[];
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
  onAuthorProfileChange: (profile: AuthorProfile) => void;
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

function SettingsIcon({ size = 18, ...props }: IconProps) {
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
      <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" />
      <path d="M4.5 12h2.1m10.8 0h2.1M12 4.5v2.1M12 17.4v2.1M6.7 6.7l1.5 1.5m7.6 7.6 1.5 1.5M17.3 6.7l-1.5 1.5m-7.6 7.6-1.5 1.5" />
      <circle cx="12" cy="12" r="8.25" />
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
  onAuthorProfileChange
}: SidebarProps) {
  const [draftProfile, setDraftProfile] = useState<AuthorProfile>(authorProfile);

  useEffect(() => {
    if (activePanel === 'settings') {
      setDraftProfile(authorProfile);
    }
  }, [activePanel, authorProfile]);

  const noteMetrics = useMemo(
    () => ({
      total: notes.length,
      recent: notes[0] ? formatDate(notes[0].updatedAt) : '--'
    }),
    [notes]
  );

  const handleProfileFieldChange =
    (field: keyof AuthorProfile) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraftProfile((prevProfile) => ({
        ...prevProfile,
        [field]: event.target.value
      }));
    };

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAuthorProfileChange({
      ...draftProfile,
      name: draftProfile.name.trim() || authorProfile.name,
      role: draftProfile.role.trim() || authorProfile.role,
      bio: draftProfile.bio.trim() || authorProfile.bio,
      wechatTitle: draftProfile.wechatTitle.trim() || authorProfile.wechatTitle,
      githubUrl: draftProfile.githubUrl.trim() || authorProfile.githubUrl
    });
  };

  const renderQrCard = () => {
    if (authorProfile.wechatQrUrl.trim()) {
      return (
        <div className="rounded-[28px] border border-[#30363d] bg-white p-4 shadow-2xl shadow-black/25">
          <img
            src={authorProfile.wechatQrUrl}
            alt={`${authorProfile.wechatTitle} 二维码`}
            className="h-48 w-48 rounded-2xl object-cover"
          />
        </div>
      );
    }

    return (
      <div className="rounded-[28px] border border-[#30363d] bg-[radial-gradient(circle_at_top,#1b2b1f_0%,#10161d_55%,#0b1117_100%)] p-4">
        <svg viewBox="0 0 120 120" className="h-48 w-48 rounded-2xl bg-white p-4 text-slate-950">
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

  const renderNoteButton = (note: Note) => {
    const isActive = note.id === activeNoteId;

    return (
      <div
        className={`rounded-2xl border px-3 py-3 transition ${
          isActive
            ? 'border-[#58a6ff] bg-[#132238] text-indigo-100'
            : 'border-[#202833] bg-[#0c121a] text-slate-200 hover:border-[#314254] hover:bg-[#111927]'
        }`}
      >
        <button
          type="button"
          onClick={() => onSelectNote(isActive ? null : note.id)}
          className="block w-full text-left"
        >
          <p className="truncate text-sm font-medium">{note.title}</p>
          <p className="mt-1 text-xs text-slate-500">{formatDate(note.updatedAt)}</p>
        </button>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.24em] text-slate-600">
            {isActive ? 'Active' : 'Note'}
          </span>
          <button
            type="button"
            onClick={() => onDeleteNote(note.id)}
            className="rounded-full px-2.5 py-1 text-xs text-[#f85149] transition hover:bg-red-500/15 hover:text-red-300"
          >
            删除
          </button>
        </div>
      </div>
    );
  };

  const renderPanelContent = () => {
    if (activePanel === 'notes') {
      return (
        <>
          <PanelHeader
            title="笔记列表"
            description="快速切换、创建或临时取消选中，让工作区进入 Dashboard。"
            onClose={() => onPanelChange(null)}
          />
          <div className="flex items-center justify-between border-b border-[#202833] px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Library</p>
              <p className="mt-1 text-sm text-slate-300">
                共 {noteMetrics.total} 条，最近更新于 {noteMetrics.recent}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onSelectNote(null)}
                className="rounded-full border border-[#30363d] px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={onCreateNote}
                className="rounded-full bg-[linear-gradient(135deg,#60a5fa_0%,#2563eb_100%)] px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110"
              >
                新建
              </button>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {notes.map((note) => (
              <div key={note.id}>{renderNoteButton(note)}</div>
            ))}
          </div>
        </>
      );
    }

    if (activePanel === 'search') {
      return (
        <>
          <PanelHeader
            title="搜索"
            description="同时匹配标题和正文，作为独立功能面板使用。"
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
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {searchResults.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#30363d] px-4 py-10 text-center text-sm text-slate-400">
                没有找到匹配内容，试试正文关键字。
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((note) => (
                  <div key={note.id}>{renderNoteButton(note)}</div>
                ))}
              </div>
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
          <div className="flex flex-1 flex-col items-center justify-between gap-6 overflow-hidden px-5 py-6">
            <div className="space-y-4 text-center">
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

    if (activePanel === 'settings') {
      return (
        <>
          <PanelHeader
            title="设置"
            description="在这里编辑作者资料、公众号信息和 GitHub 地址。"
            onClose={() => onPanelChange(null)}
          />
          <form className="flex flex-1 flex-col overflow-hidden" onSubmit={handleProfileSubmit}>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.24em] text-slate-500">
                  作者名称
                </span>
                <input
                  value={draftProfile.name}
                  onChange={handleProfileFieldChange('name')}
                  className="w-full rounded-2xl border border-[#30363d] bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-slate-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.24em] text-slate-500">
                  身份标签
                </span>
                <input
                  value={draftProfile.role}
                  onChange={handleProfileFieldChange('role')}
                  className="w-full rounded-2xl border border-[#30363d] bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-slate-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.24em] text-slate-500">
                  个人简介
                </span>
                <textarea
                  value={draftProfile.bio}
                  onChange={handleProfileFieldChange('bio')}
                  className="min-h-28 w-full rounded-2xl border border-[#30363d] bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-slate-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.24em] text-slate-500">
                  公众号名称
                </span>
                <input
                  value={draftProfile.wechatTitle}
                  onChange={handleProfileFieldChange('wechatTitle')}
                  className="w-full rounded-2xl border border-[#30363d] bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-slate-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.24em] text-slate-500">
                  二维码图片链接
                </span>
                <input
                  value={draftProfile.wechatQrUrl}
                  onChange={handleProfileFieldChange('wechatQrUrl')}
                  className="w-full rounded-2xl border border-[#30363d] bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-slate-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.24em] text-slate-500">
                  GitHub 链接
                </span>
                <input
                  value={draftProfile.githubUrl}
                  onChange={handleProfileFieldChange('githubUrl')}
                  className="w-full rounded-2xl border border-[#30363d] bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-slate-500"
                />
              </label>
            </div>
            <div className="border-t border-[#202833] px-5 py-4">
              <button
                type="submit"
                className="w-full rounded-2xl bg-[linear-gradient(135deg,#60a5fa_0%,#2563eb_100%)] px-4 py-3 text-sm font-medium text-white transition hover:brightness-110"
              >
                保存设置
              </button>
            </div>
          </form>
        </>
      );
    }

    return null;
  };

  return (
    <div className="flex h-full">
      <aside className="flex h-full w-16 shrink-0 flex-col items-center justify-between border-r border-[#161b22] bg-[#04070b] py-4">
        <div className="flex flex-col items-center gap-3">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#1e2632] bg-[#09111b] text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
            MD
          </div>
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

        <NavButton
          active={activePanel === 'settings'}
          label="设置"
          onClick={() => onPanelChange('settings')}
          icon={<SettingsIcon />}
        />
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
