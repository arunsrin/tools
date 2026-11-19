export type HistoricalEra =
  | 'Ancient Greece & Rome'
  | 'Early Christian & Middle Ages'
  | 'Renaissance & Reformation'
  | 'Enlightenment & Scientific Revolution'
  | '19th Century'
  | '20th Century';

export type BookGenre =
  | 'Philosophy & Ethics'
  | 'Epic & Poetry'
  | 'Drama & Theater'
  | 'Fiction & Literature'
  | 'History, Politics & Society'
  | 'Science & Mathematics'
  | 'Theology & Sacred Texts'
  | 'Essays & Satire'
  | 'Psychology & Mind';

export type DownloadSource =
  | 'Project Gutenberg'
  | 'In Copyright · Reference Only';

export interface BookWork {
  id: string;
  title: string;
  gbww: boolean; // Great Books of the Western World single asterisk (*)
  note?: string | null;
  inCopyright: boolean;
  downloadUrl: string | null;
  source: DownloadSource;
  formats: string[];
}

export interface AdlerAuthor {
  id: number;
  name: string;
  dates: string;
  era: HistoricalEra;
  genre: BookGenre;
  gatewayToGreatBooks: boolean; // Gateway to the Great Books double asterisk (**)
  works: BookWork[];
}

export type ViewMode = 'timeline' | 'genre';
