import type {
  AdlerAuthor,
  HistoricalEra,
  BookGenre,
} from './greatBooksTypes';

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

export interface GreatBooksCorpusStats {
  totalAuthors: number;
  totalWorks: number;
  publicDomainWorks: number;
  inCopyrightWorks: number;
}

export function calculateCorpusStats(authors: AdlerAuthor[]): GreatBooksCorpusStats {
  const totalAuthors = authors.length;
  let totalWorks = 0;
  let publicDomainWorks = 0;
  let inCopyrightWorks = 0;

  for (const author of authors) {
    totalWorks += author.works.length;
    for (const work of author.works) {
      if (work.inCopyright) {
        inCopyrightWorks++;
      } else if (work.downloadUrl) {
        publicDomainWorks++;
      }
    }
  }

  return {
    totalAuthors,
    totalWorks,
    publicDomainWorks,
    inCopyrightWorks,
  };
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

