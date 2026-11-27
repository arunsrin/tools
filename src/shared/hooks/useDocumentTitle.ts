import { useEffect } from 'react';

/**
 * Updates `document.title` while the component is mounted and restores the
 * previous title captured at mount on unmount.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previousTitle = document.title;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    document.title = title;
  }, [title]);
}
