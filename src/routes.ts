export type ToolKey = 'big' | 'timezone' | 'picker' | 'pomo' | 'pals' | 'fractal' | 'biomorphs';
export type View = 'hub' | ToolKey;

export interface ToolRegistryEntry {
  key: ToolKey;
  path: string;
  title: string;
  description: string;
  icon: string;
  featured?: boolean;
}

export const TOOL_REGISTRY: readonly ToolRegistryEntry[] = [
  {
    key: 'big',
    path: '/big',
    title: 'Big Text',
    description: 'Display large text to fill your entire screen. Perfect for noisy places.',
    icon: '🔠',
  },
  {
    key: 'biomorphs',
    path: '/biomorphs',
    title: 'Biomorphs',
    description: 'Evolutionary Watchmaker: guide alien organism morphology through comparative duels.',
    icon: '🧬',
    featured: true,
  },
  {
    key: 'pomo',
    path: '/pomo',
    title: 'Cute Pomo',
    description: 'Playful Pomodoro timer with Sprouting Tomato Buddy, chimes & cycle tracking.',
    icon: '🍅',
  },
  {
    key: 'pals',
    path: '/pals',
    title: 'Desktop Pals',
    description: 'Playful browser companions, physics playground, obstacles, toys & treats.',
    icon: '🐾',
  },
  {
    key: 'fractal',
    path: '/fractal',
    title: 'Fractal Explorer',
    description: 'Deep zoom Mandelbrot, Julia & Burning Ship sets with 4K wallpaper studio.',
    icon: '🌀',
  },
  {
    key: 'picker',
    path: '/picker',
    title: 'Random Picker',
    description: 'Playful coin flips, multi-dice rolls, and customizable spinning wheel picker.',
    icon: '🎯',
  },
  {
    key: 'timezone',
    path: '/timezone',
    title: 'Timezone Converter',
    description: 'Visual 3-day world clock, overlapping working hours & meeting planner.',
    icon: '🌐',
  },
] as const;

export const TOOL_ROUTES: Record<ToolKey, string> = {
  big: '/big',
  timezone: '/timezone',
  picker: '/picker',
  pomo: '/pomo',
  pals: '/pals',
  fractal: '/fractal',
  biomorphs: '/biomorphs',
};

export const TOOL_BY_KEY: Record<ToolKey, ToolRegistryEntry> = {
  big: TOOL_REGISTRY[0],
  biomorphs: TOOL_REGISTRY[1],
  pomo: TOOL_REGISTRY[2],
  pals: TOOL_REGISTRY[3],
  fractal: TOOL_REGISTRY[4],
  picker: TOOL_REGISTRY[5],
  timezone: TOOL_REGISTRY[6],
};

const ROUTE_TO_TOOL: Record<string, ToolKey> = {
  big: 'big',
  timezone: 'timezone',
  picker: 'picker',
  pomo: 'pomo',
  pals: 'pals',
  fractal: 'fractal',
  biomorphs: 'biomorphs',
};

function matchSingleSegmentTool(rawPath: string): ToolKey | null {
  const pathOnly = rawPath.split('?')[0] ?? '';
  const segments = pathOnly.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (segments.length !== 1) {
    return null;
  }
  const segment = segments[0].toLowerCase();
  return Object.prototype.hasOwnProperty.call(ROUTE_TO_TOOL, segment)
    ? ROUTE_TO_TOOL[segment]
    : null;
}

/**
 * Parses pathname/hash into a `ToolKey`, or `null` when no exact tool route matches
 * (e.g. `/`, `/unknown`, or nested `/big/extra`).
 */
export function parseToolRoute(pathname: string, hash = ''): ToolKey | null {
  // Check hash fallback first (e.g. #/timezone or #timezone)
  const normalizedHash = hash.replace(/^#\/?/, '').trim();
  if (normalizedHash) {
    const hashMatch = matchSingleSegmentTool(normalizedHash);
    if (hashMatch) {
      return hashMatch;
    }
  }

  // Parse path: exact single segment only (e.g. "/timezone" or "/timezone/")
  return matchSingleSegmentTool(pathname);
}

export function parseRoute(pathname: string, hash = ''): View {
  return parseToolRoute(pathname, hash) ?? 'hub';
}

export function getPathForView(view: View): string {
  return view === 'hub' ? '/' : TOOL_ROUTES[view];
}

/**
 * Builds the normalized URL when syncing route state, stripping fallback
 * route hashes (e.g. `#/timezone`) while preserving query params and non-route hashes.
 */
export function buildNormalizedUrl(targetPath: string, search = '', hash = ''): string {
  const normalizedHash = hash.replace(/^#\/?/, '').trim();
  const isRouteHash = normalizedHash.length > 0 && matchSingleSegmentTool(normalizedHash) !== null;

  let resolvedSearch = search;
  if (!resolvedSearch && isRouteHash) {
    const queryIdx = normalizedHash.indexOf('?');
    if (queryIdx !== -1) {
      resolvedSearch = normalizedHash.slice(queryIdx);
    }
  }

  const resolvedHash = isRouteHash ? '' : hash;
  return `${targetPath}${resolvedSearch}${resolvedHash}`;
}
