
export interface PrintModel {
  id: string;
  name: string;
  path: string;
  extension: string;
  size: number;
  lastModified: number;
  tags: string[];
  directoryTags: string[];
  description?: string;
}

export interface LibraryState {
  rootPath: string | null;
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
