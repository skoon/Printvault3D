
export interface LibraryDirectory {
  id: string;
  path: string;
  label: string;
}

export interface PrintModel {
  id: string;
  directoryId: string;
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
  directories: LibraryDirectory[];
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
