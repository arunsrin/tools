import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from './useDocumentTitle';

describe('useDocumentTitle', () => {
  const initialTitle = 'Tools Hub - Simple, Self-Contained Utilities';

  beforeEach(() => {
    document.title = initialTitle;
  });

  afterEach(() => {
    document.title = initialTitle;
  });

  it('sets document.title while mounted and restores previous title on unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ title }) => useDocumentTitle(title),
      { initialProps: { title: '25:00 - Cute Pomo' } }
    );

    expect(document.title).toBe('25:00 - Cute Pomo');

    rerender({ title: '24:59 - Cute Pomo' });
    expect(document.title).toBe('24:59 - Cute Pomo');

    unmount();
    expect(document.title).toBe(initialTitle);
  });
});
