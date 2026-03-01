
export interface PrintModel {
  id: string;
  name: string;
  path: string;
  extension: string;
  size: number;
  lastModified: number;
  tags: string[];
  directoryTags: string[];
  handle?: FileSystemFileHandle;
  description?: string;
}

export interface LibraryState {
  rootHandle: FileSystemDirectoryHandle | null;
  models: PrintModel[];
  lastScan: number | null;
  availableTags: string[];
}

export enum ViewMode {
  GRID = 'GRID',
  LIST = 'LIST'
}

export interface TagFilter {
  inclusive: string[];
  exclusive: string[];
}
