export type Category = 'all' | 'tech' | 'dev' | 'news' | 'design';

export type ViewMode = 'columns' | 'river';

export type SortMode = 'latest' | 'popular';

export interface FeedItem {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceId: string;
  category: Exclude<Category, 'all'>;
  publishedAt: string;
  points?: number;
  comments?: number;
  domain: string;
}

export interface FeedSource {
  id: string;
  name: string;
  category: Exclude<Category, 'all'>;
  icon: string;
  description: string;
  color: string;
  enabled: boolean;
  fetchType?: 'hn' | 'reddit' | 'lobsters' | 'json';
  fetchUrl?: string;
}

export interface FeedData {
  lastUpdated: string;
  sources: FeedSource[];
  items: FeedItem[];
}

export interface NewsRiverPreferences {
  viewMode: ViewMode;
  sortMode: SortMode;
  selectedCategory: Category;
  enabledSourceIds: string[];
  readItemIds: string[];
}
