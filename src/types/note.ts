export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  // folderId 为空表示位于根目录；兼容旧数据，读取时按 null 处理。
  folderId?: string | null;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
}

export interface ImportedNoteDraft {
  title: string;
  content: string;
  sourceName: string;
  sourceSize: number;
  /**
   * 相对于用户选择根的目录分段（不含文件名本身）。
   * 例如 `work/project-a/readme.md` → ['work', 'project-a']。
   */
  folderPath?: string[];
}
