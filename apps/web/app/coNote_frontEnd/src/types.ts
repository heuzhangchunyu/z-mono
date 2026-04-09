export interface DocumentFile {
  id: string;
  name: string;
  content: string;
}

export interface CommandLog {
  id: string;
  command: string;
  lines: string[];
}
