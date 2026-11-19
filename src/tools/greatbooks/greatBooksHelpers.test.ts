import { describe, it, expect } from 'vitest';
import {
  filterAuthors,
  calculateCorpusStats,
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
        downloadUrl: 'https://manybooks.net/titles/homer2426924269-8.html',
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

  describe('calculateCorpusStats', () => {
    it('calculates total authors, works, and public domain works correctly', () => {
      const stats = calculateCorpusStats(mockAuthors);

      expect(stats.totalAuthors).toBe(3);
      expect(stats.totalWorks).toBe(4);
      expect(stats.publicDomainWorks).toBe(3);
      expect(stats.inCopyrightWorks).toBe(1);
    });

    it('handles zero authors gracefully', () => {
      const stats = calculateCorpusStats([]);
      expect(stats.totalAuthors).toBe(0);
      expect(stats.totalWorks).toBe(0);
      expect(stats.publicDomainWorks).toBe(0);
      expect(stats.inCopyrightWorks).toBe(0);
    });
  });
});
