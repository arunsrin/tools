import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadCanvasPng, getCanvasPointerPos, syncCanvasDpr } from './canvas';

describe('canvas utilities', () => {
  const originalDprDescriptor = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalDprDescriptor) {
      Object.defineProperty(window, 'devicePixelRatio', originalDprDescriptor);
    } else {
      delete (window as { devicePixelRatio?: number }).devicePixelRatio;
    }
  });

  describe('downloadCanvasPng', () => {
    it('exports PNG data URL via an anchor click and cleans up DOM element', () => {
      const canvas = document.createElement('canvas');
      vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/png;base64,AAAA');
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      const ok = downloadCanvasPng(canvas, 'art.png');
      expect(ok).toBe(true);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(document.querySelectorAll('a[download="art.png"]')).toHaveLength(0);
    });

    it('returns false when toDataURL throws or returns empty string', () => {
      const canvas = document.createElement('canvas');
      vi.spyOn(canvas, 'toDataURL').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(downloadCanvasPng(canvas, 'fail.png')).toBe(false);

      vi.spyOn(canvas, 'toDataURL').mockReturnValue('');
      expect(downloadCanvasPng(canvas, 'empty.png')).toBe(false);
    });
  });

  describe('getCanvasPointerPos', () => {
    it('scales client coordinates against CSS rect and logical dimensions', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 50,
        width: 400,
        height: 300,
        right: 500,
        bottom: 350,
        x: 100,
        y: 50,
        toJSON: () => ({}),
      });

      const pos = getCanvasPointerPos({ clientX: 300, clientY: 200 }, canvas);
      expect(pos).toEqual({ x: 400, y: 300 });

      const logicalPos = getCanvasPointerPos({ clientX: 200, clientY: 125 }, canvas, 200, 100);
      expect(logicalPos).toEqual({ x: 50, y: 25 });
    });

    it('returns { x: 0, y: 0 } when bounding rect has zero dimensions', () => {
      const canvas = document.createElement('canvas');
      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      expect(getCanvasPointerPos({ clientX: 50, clientY: 50 }, canvas)).toEqual({ x: 0, y: 0 });
    });
  });

  describe('syncCanvasDpr', () => {
    it('clamps DPR to maxDpr, sets backing dimensions, and configures 2D transform', () => {
      Object.defineProperty(window, 'devicePixelRatio', {
        configurable: true,
        writable: true,
        value: 3,
      });

      const canvas = document.createElement('canvas');
      const setTransform = vi.fn();
      vi.spyOn(canvas, 'getContext').mockReturnValue({ setTransform } as unknown as CanvasRenderingContext2D);

      const metrics = syncCanvasDpr(canvas, 320, 240, 2);
      expect(metrics).toEqual({ width: 320, height: 240, dpr: 2 });
      expect(canvas.width).toBe(640);
      expect(canvas.height).toBe(480);
      expect(setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    });

    it('defaults DPR to 1 and tolerates null getContext', () => {
      Object.defineProperty(window, 'devicePixelRatio', {
        configurable: true,
        writable: true,
        value: 0,
      });

      const canvas = document.createElement('canvas');
      vi.spyOn(canvas, 'getContext').mockReturnValue(null);

      const metrics = syncCanvasDpr(canvas, 200, 100);
      expect(metrics).toEqual({ width: 200, height: 100, dpr: 1 });
      expect(canvas.width).toBe(200);
      expect(canvas.height).toBe(100);
    });
  });
});
