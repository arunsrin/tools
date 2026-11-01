export type ToolKey = 'big' | 'timezone' | 'picker' | 'pomo' | 'biomorphs';
export type View = 'hub' | ToolKey;

export const TOOL_ROUTES: Record<ToolKey, string> = {
  big: '/big',
  timezone: '/timezone',
  picker: '/picker',
  pomo: '/pomo',
  biomorphs: '/biomorphs',
};

const ROUTE_TO_TOOL: Record<string, ToolKey> = {
  big: 'big',
  timezone: 'timezone',
  picker: 'picker',
  pomo: 'pomo',
  biomorphs: 'biomorphs',
};

export function parseRoute(pathname: string, hash = ''): View {
  // Check hash fallback first (e.g. #/timezone or #timezone)
  const normalizedHash = hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (normalizedHash && ROUTE_TO_TOOL[normalizedHash]) {
    return ROUTE_TO_TOOL[normalizedHash];
  }

  // Parse path: e.g. "/timezone" or "/timezone/"
  const segments = pathname.replace(/^\/+|\/+$/g, '').split('/');
  const first = segments[0]?.toLowerCase();
  if (first && ROUTE_TO_TOOL[first]) {
    return ROUTE_TO_TOOL[first];
  }

  return 'hub';
}

export function getPathForView(view: View): string {
  return view === 'hub' ? '/' : TOOL_ROUTES[view];
}
