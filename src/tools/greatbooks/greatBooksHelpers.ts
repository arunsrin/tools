import type {
  AdlerAuthor,
  HistoricalEra,
  BookGenre,
  ReadingTrackerState,
  ReadingStatus,
} from './greatBooksTypes';

export const LOCAL_STORAGE_KEY = 'tools_hub_adler_great_books_tracker_v1';

export const HISTORICAL_ERAS: HistoricalEra[] = [
  'Ancient Greece & Rome',
  'Early Christian & Middle Ages',
  'Renaissance & Reformation',
  'Enlightenment & Scientific Revolution',
  '19th Century',
  '20th Century',
];

export const BOOK_GENRES: BookGenre[] = [
  'Philosophy & Ethics',
  'Epic & Poetry',
  'Drama & Theater',
  'Fiction & Literature',
  'History, Politics & Society',
  'Science & Mathematics',
  'Theology & Sacred Texts',
  'Essays & Satire',
  'Psychology & Mind',
];

export type QuickFilter = 'all' | 'free_only' | 'gbww' | 'gateway' | 'copyright';

export interface FilterOptions {
  searchQuery: string;
  era: HistoricalEra | 'all';
  genre: BookGenre | 'all';
  quickFilter: QuickFilter;
}

export interface ReadingProgressStats {
  totalAuthors: number;
  totalWorks: number;
  publicDomainWorks: number;
  completedCount: number;
  readingCount: number;
  wantToReadCount: number;
  percentCompleted: number;
}

export function loadReadingTracker(): ReadingTrackerState {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as ReadingTrackerState;
    }
  } catch (e) {
    console.warn('Failed to load Great Books reading tracker from localStorage:', e);
  }
  return {};
}

export function saveReadingTracker(state: ReadingTrackerState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save Great Books reading tracker to localStorage:', e);
  }
}

export function filterAuthors(
  authors: AdlerAuthor[],
  options: FilterOptions
): AdlerAuthor[] {
  const query = options.searchQuery.trim().toLowerCase();

  return authors
    .filter((author) => {
      // 1. Era filter
      if (options.era !== 'all' && author.era !== options.era) {
        return false;
      }

      // 2. Genre filter
      if (options.genre !== 'all' && author.genre !== options.genre) {
        return false;
      }

      // 3. Quick filter
      if (options.quickFilter === 'gateway' && !author.gatewayToGreatBooks) {
        return false;
      }

      if (options.quickFilter === 'gbww') {
        const hasGbww = author.works.some((w) => w.gbww);
        if (!hasGbww) return false;
      }

      if (options.quickFilter === 'free_only') {
        const hasFree = author.works.some((w) => !w.inCopyright && w.downloadUrl !== null);
        if (!hasFree) return false;
      }

      if (options.quickFilter === 'copyright') {
        const hasCopyright = author.works.some((w) => w.inCopyright);
        if (!hasCopyright) return false;
      }

      // 4. Search query
      if (!query) return true;

      const matchesAuthor =
        author.name.toLowerCase().includes(query) ||
        author.dates.toLowerCase().includes(query) ||
        author.era.toLowerCase().includes(query) ||
        author.genre.toLowerCase().includes(query) ||
        String(author.id).includes(query);

      if (matchesAuthor) return true;

      const matchesWork = author.works.some(
        (w) =>
          w.title.toLowerCase().includes(query) ||
          (w.note && w.note.toLowerCase().includes(query)) ||
          w.source.toLowerCase().includes(query)
      );

      return matchesWork;
    });
}

export function calculateStats(
  authors: AdlerAuthor[],
  tracker: ReadingTrackerState
): ReadingProgressStats {
  const totalAuthors = authors.length;
  let totalWorks = 0;
  let publicDomainWorks = 0;

  for (const author of authors) {
    totalWorks += author.works.length;
    for (const work of author.works) {
      if (!work.inCopyright && work.downloadUrl) {
        publicDomainWorks++;
      }
    }
  }

  let completedCount = 0;
  let readingCount = 0;
  let wantToReadCount = 0;

  // Track status per author (or work)
  for (const status of Object.values(tracker)) {
    if (status === 'completed') completedCount++;
    else if (status === 'reading') readingCount++;
    else if (status === 'want_to_read') wantToReadCount++;
  }

  const percentCompleted =
    totalAuthors > 0 ? Math.min(100, Math.round((completedCount / totalAuthors) * 100)) : 0;

  return {
    totalAuthors,
    totalWorks,
    publicDomainWorks,
    completedCount,
    readingCount,
    wantToReadCount,
    percentCompleted,
  };
}

export function getStatusLabel(status?: ReadingStatus): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'reading':
      return 'Currently Reading';
    case 'want_to_read':
      return 'Want to Read';
    default:
      return 'Mark Status';
  }
}
