export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface ImportedNoteDraft {
  title: string;
  content: string;
  sourceName: string;
  sourceSize: number;
}
