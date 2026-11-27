import { useEffect, useRef } from 'react';
import { drawBiomorph } from './biomorphEngine';
import type { LineageThumbnailProps } from './types';

export default function LineageThumbnail({ ancestor, isActive, onClick }: LineageThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawBiomorph(ctx, ancestor, 76, 60, 0);
      }
    }
  }, [ancestor]);

  return (
    <button
      type="button"
      className={`lineage-card ${isActive ? 'active-ancestor' : ''}`}
      onClick={onClick}
      title={`Gen ${ancestor.generation}: ${ancestor.name}`}
      aria-pressed={isActive}
    >
      <canvas ref={canvasRef} width={76} height={60} className="lineage-thumb-canvas" />
      <span className="lineage-gen-label">Gen {ancestor.generation}</span>
      <span className="lineage-name-label">{ancestor.name.split(' ')[0]}</span>
    </button>
  );
}
