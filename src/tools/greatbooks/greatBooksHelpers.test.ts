import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadReadingTracker,
  saveReadingTracker,
  filterAuthors,
  calculateStats,
  getStatusLabel,
  LOCAL_STORAGE_KEY,
} from './greatBooksHelpers';
import type { AdlerAuthor } from './greatBooksTypes';

const mockAuthors: AdlerAuthor[] = [
  {
    id: 1,
    name: 'Homer',
    dates: '9th Century B.C.?',
    era: 'Ancient Greece & Rome',
    genre: 'Epic & Poetry',
    gatewayToGreatBooks: false,
    works: [
      {
        id: '1-a',
        title: 'Iliad',
        gbww: true,
        inCopyright: false,
        downloadUrl: 'https://manybooks.net/titles/homer2238222382-8.html',
        source: 'ManyBooks',
        formats: ['ePub', 'PDF'],
      },
      {
        id: '1-b',
        title: 'Odyssey',
        gbww: true,
        inCopyright: false,
        downloadUrl: 'https://manybooks.net/titles/homeretext99dyssy08a.html',
        source: 'ManyBooks',
        formats: ['ePub', 'PDF'],
      },
    ],
  },
  {
    id: 12,
    name: 'Epicurus',
    dates: 'c. 341–270 B.C.',
    era: 'Ancient Greece & Rome',
    genre: 'Philosophy & Ethics',
    gatewayToGreatBooks: true,
    works: [
      {
        id: '12-a',
        title: 'Letter to Herodotus',
        gbww: false,
        inCopyright: false,
        downloadUrl: 'https://www.gutenberg.org/ebooks/57898',
        source: 'Project Gutenberg',
        formats: ['ePub', 'HTML'],
      },
    ],
  },
  {
    id: 136,
    name: 'Jean Paul Sartre',
    dates: '1905–',
    era: '20th Century',
    genre: 'Philosophy & Ethics',
    gatewayToGreatBooks: false,
    works: [
      {
        id: '136-a',
        title: 'Nausea',
        gbww: false,
        inCopyright: true,
        downloadUrl: null,
        source: 'In Copyright · Reference Only',
        formats: [],
      },
    ],
  },
];

describe('greatBooksHelpers', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('localStorage reading tracker', () => {
    it('returns empty object when localStorage is empty', () => {
      expect(loadReadingTracker()).toEqual({});
    });

    it('loads and saves tracker state correctly', () => {
      const state = { '1': 'completed' as const, '12': 'reading' as const };
      saveReadingTracker(state);
      expect(loadReadingTracker()).toEqual(state);
    });

    it('gracefully handles JSON parse errors in localStorage', () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'corrupted-json{');
      expect(loadReadingTracker()).toEqual({});
    });

    it('gracefully handles localStorage write failures', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });
      // Should not throw
      expect(() => saveReadingTracker({ '1': 'completed' })).not.toThrow();
    });
  });

  describe('filterAuthors', () => {
    it('returns all authors when default options are provided', () => {
      const res = filterAuthors(mockAuthors, {
        searchQuery: '',
        era: 'all',
        genre: 'all',
        quickFilter: 'all',
      });
      expect(res).toHaveLength(3);
    });

    it('filters by historical era', () => {
      const res = filterAuthors(mockAuthors, {
        searchQuery: '',
        era: '20th Century',
        genre: 'all',
        quickFilter: 'all',
      });
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('Jean Paul Sartre');
    });

    it('filters by genre', () => {
      const res = filterAuthors(mockAuthors, {
        searchQuery: '',
        era: 'all',
        genre: 'Epic & Poetry',
        quickFilter: 'all',
      });
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('Homer');
    });

    it('filters by quickFilter "free_only"', () => {
      const res = filterAuthors(mockAuthors, {
        searchQuery: '',
        era: 'all',
        genre: 'all',
        quickFilter: 'free_only',
      });
      expect(res).toHaveLength(2);
      expect(res.map((a) => a.name)).toEqual(['Homer', 'Epicurus']);
    });

    it('filters by quickFilter "gbww"', () => {
      const res = filterAuthors(mockAuthors, {
        searchQuery: '',
        era: 'all',
        genre: 'all',
        quickFilter: 'gbww',
      });
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('Homer');
    });

    it('filters by quickFilter "gateway"', () => {
      const res = filterAuthors(mockAuthors, {
        searchQuery: '',
        era: 'all',
        genre: 'all',
        quickFilter: 'gateway',
      });
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('Epicurus');
    });

    it('filters by quickFilter "copyright"', () => {
      const res = filterAuthors(mockAuthors, {
        searchQuery: '',
        era: 'all',
        genre: 'all',
        quickFilter: 'copyright',
      });
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('Jean Paul Sartre');
    });

    it('filters by search query matching author name', () => {
      const res = filterAuthors(mockAuthors, {
        searchQuery: 'sartre',
        era: 'all',
        genre: 'all',
        quickFilter: 'all',
      });
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('Jean Paul Sartre');
    });

    it('filters by search query matching work title', () => {
      const res = filterAuthors(mockAuthors, {
        searchQuery: 'odyssey',
        era: 'all',
        genre: 'all',
        quickFilter: 'all',
      });
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('Homer');
    });
  });

  describe('calculateStats', () => {
    it('calculates total authors, works, and completed percentage correctly', () => {
      const tracker = { '1': 'completed' as const, '12': 'reading' as const };
      const stats = calculateStats(mockAuthors, tracker);

      expect(stats.totalAuthors).toBe(3);
      expect(stats.totalWorks).toBe(4);
      expect(stats.publicDomainWorks).toBe(3);
      expect(stats.completedCount).toBe(1);
      expect(stats.readingCount).toBe(1);
      expect(stats.wantToReadCount).toBe(0);
      expect(stats.percentCompleted).toBe(33); // 1 / 3 = 33%
    });

    it('handles zero authors gracefully', () => {
      const stats = calculateStats([], {});
      expect(stats.totalAuthors).toBe(0);
      expect(stats.percentCompleted).toBe(0);
    });
  });

  describe('getStatusLabel', () => {
    it('returns appropriate labels for each status', () => {
      expect(getStatusLabel('completed')).toBe('Completed');
      expect(getStatusLabel('reading')).toBe('Currently Reading');
      expect(getStatusLabel('want_to_read')).toBe('Want to Read');
      expect(getStatusLabel(undefined)).toBe('Mark Status');
    });
  });
});
