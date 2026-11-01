import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Biomorphs from './Biomorphs';
import {
  createPrimordialGenome,
  mutateGenome,
  drawBiomorph,
  type BiomorphGenome,
} from './biomorphEngine';

describe('Biomorphs Component & Engine', () => {
  const onBackMock = vi.fn();
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    // Mock window.alert
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    // Scoped 2D context mock for Biomorphs
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      clearRect: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      lineWidth: 1,
      strokeStyle: '#ffffff',
      fillStyle: '#000000',
      lineCap: 'round',
      lineJoin: 'round',
      shadowColor: 'transparent',
      shadowBlur: 0,
      font: '10px sans-serif',
      textAlign: 'center',
    };

    // @ts-expect-error test mock
    HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
      if (type === '2d') return mockCtx;
      return null;
    });

    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock');
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
    vi.restoreAllMocks();
  });

  it('renders header, title, action buttons, toolbar and duel arena', () => {
    render(<Biomorphs onBack={onBackMock} />);

    expect(screen.getByRole('heading', { level: 1, name: /biomorphs: the evolutionary watchmaker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new genesis/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy dna/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export png/i })).toBeInTheDocument();

    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 0/i);
    expect(screen.getByTestId('specimen-alpha-card')).toBeInTheDocument();
    expect(screen.getByTestId('specimen-beta-card')).toBeInTheDocument();
    expect(screen.getByTestId('lineage-timeline')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<Biomorphs onBack={onBackMock} />);
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it('selects Specimen Alpha on click and advances generation', () => {
    render(<Biomorphs onBack={onBackMock} />);
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 0/i);

    fireEvent.click(screen.getByTestId('specimen-alpha-card'));

    // Advances to Gen 1
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 1/i);
    expect(screen.getByText(/selected/i)).toBeInTheDocument();
  });

  it('selects Specimen Beta on click and advances generation', () => {
    render(<Biomorphs onBack={onBackMock} />);
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 0/i);

    fireEvent.click(screen.getByTestId('specimen-beta-card'));

    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 1/i);
  });

  it('supports keyboard navigation (ArrowLeft and ArrowRight)', () => {
    render(<Biomorphs onBack={onBackMock} />);
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 0/i);

    // Left Arrow advances
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 1/i);

    // Right Arrow advances to Gen 2
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 2/i);

    // Number keys '1' and '2' also work
    fireEvent.keyDown(window, { key: '1' });
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 3/i);

    fireEvent.keyDown(window, { key: '2' });
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 4/i);
  });

  it('supports keyboard shortcut R to trigger New Genesis', () => {
    render(<Biomorphs onBack={onBackMock} />);

    // Advance to Gen 2
    fireEvent.click(screen.getByTestId('specimen-alpha-card'));
    fireEvent.click(screen.getByTestId('specimen-alpha-card'));
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 2/i);

    // Press 'r'
    fireEvent.keyDown(window, { key: 'r' });
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 0/i);
    expect(screen.getByText(/new genesis initiated/i)).toBeInTheDocument();
  });

  it('switches mutation drift intensity', () => {
    render(<Biomorphs onBack={onBackMock} />);

    const subtleBtn = screen.getByTestId('mutation-btn-subtle');
    const radicalBtn = screen.getByTestId('mutation-btn-radical');

    fireEvent.click(subtleBtn);
    expect(subtleBtn).toHaveClass('active');

    fireEvent.click(radicalBtn);
    expect(radicalBtn).toHaveClass('active');
    expect(subtleBtn).not.toHaveClass('active');
  });

  it('allows time-travel to past ancestors in the lineage strip', () => {
    render(<Biomorphs onBack={onBackMock} />);

    // Evolve 2 generations
    fireEvent.click(screen.getByTestId('specimen-alpha-card'));
    fireEvent.click(screen.getByTestId('specimen-alpha-card'));
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 2/i);

    // Click ancestor 0 in lineage
    const ancestor0 = screen.getByTestId('lineage-ancestor-0');
    fireEvent.click(ancestor0);

    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 0/i);
    expect(screen.getByText(/rewound to gen 0/i)).toBeInTheDocument();
  });

  it('copies DNA to clipboard', () => {
    render(<Biomorphs onBack={onBackMock} />);

    fireEvent.click(screen.getByRole('button', { name: /copy dna/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(screen.getByText(/dna code copied/i)).toBeInTheDocument();
  });

  it('opens DNA modal, handles invalid input, and loads valid genome', () => {
    render(<Biomorphs onBack={onBackMock} />);

    // Open DNA modal
    fireEvent.click(screen.getByRole('button', { name: /^🧬 dna$/i }));
    expect(screen.getByRole('heading', { level: 3, name: /organism dna code/i })).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/paste base64 dna code here/i);
    const loadBtn = screen.getByRole('button', { name: /load dna/i });

    // Invalid DNA
    fireEvent.change(textarea, { target: { value: 'not-valid-base64-json' } });
    fireEvent.click(loadBtn);
    expect(window.alert).toHaveBeenCalled();

    // Valid DNA
    const testGenome: BiomorphGenome = createPrimordialGenome();
    testGenome.generation = 42;
    testGenome.name = 'TestMorph Custom';
    const validBase64 = btoa(JSON.stringify(testGenome));

    fireEvent.change(textarea, { target: { value: validBase64 } });
    fireEvent.click(loadBtn);

    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 42/i);
    expect(screen.getByText(/loaded dna for testmorph custom/i)).toBeInTheDocument();
  });

  it('triggers Export PNG without crashing', () => {
    render(<Biomorphs onBack={onBackMock} />);

    const exportBtn = screen.getByRole('button', { name: /export png/i });
    fireEvent.click(exportBtn);

    expect(screen.getByText(/exported hd specimen snapshot/i)).toBeInTheDocument();
  });

  it('loads saved state from localStorage and recovers from corrupt data', () => {
    const savedGenome = createPrimordialGenome();
    savedGenome.generation = 9;
    savedGenome.name = 'SavedMorph';
    localStorage.setItem(
      'tools_hub_biomorphs',
      JSON.stringify({
        parentGenome: savedGenome,
        intensity: 'radical',
        lineage: [savedGenome],
      })
    );

    const { unmount } = render(<Biomorphs onBack={onBackMock} />);
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 9/i);
    expect(screen.getByTestId('mutation-btn-radical')).toHaveClass('active');
    unmount();

    // Corrupt JSON in localStorage
    localStorage.setItem('tools_hub_biomorphs', '{invalid json');
    render(<Biomorphs onBack={onBackMock} />);
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 0/i);
  });
});

describe('Biomorph Procedural Helpers & Rendering Unit Tests', () => {
  it('creates valid primordial genome with expected structure', () => {
    const genome = createPrimordialGenome();
    expect(genome.generation).toBe(0);
    expect(genome.segments.length).toBeGreaterThanOrEqual(1);
    expect(genome.limbPairs.length).toBeGreaterThanOrEqual(1);
    expect(genome.eyeCount).toBeGreaterThanOrEqual(1);
    expect(genome.primaryHue).toBeGreaterThanOrEqual(0);
    expect(genome.name).toBeTruthy();
  });

  it('mutates genome with subtle, moderate, and radical intensities', () => {
    const parent = createPrimordialGenome();

    const subtle = mutateGenome(parent, 'subtle');
    expect(subtle.child.generation).toBe(1);
    expect(subtle.mutatedTraits.length).toBeGreaterThan(0);

    const moderate = mutateGenome(parent, 'moderate');
    expect(moderate.child.generation).toBe(1);
    expect(moderate.mutatedTraits.length).toBeGreaterThan(0);

    const radical = mutateGenome(parent, 'radical');
    expect(radical.child.generation).toBe(1);
    expect(radical.mutatedTraits.length).toBeGreaterThan(0);
  });

  it('drawBiomorph executes canvas draw commands cleanly for all eye and antenna types', () => {
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      clearRect: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
    } as unknown as CanvasRenderingContext2D;

    const testGenome = createPrimordialGenome();

    // Test with default
    expect(() => drawBiomorph(mockCtx, testGenome, 400, 300, 0)).not.toThrow();

    // Test with 1 eye, 4 eyes, 6 eyes
    testGenome.eyeCount = 1;
    expect(() => drawBiomorph(mockCtx, testGenome, 400, 300, 0.5)).not.toThrow();

    testGenome.eyeCount = 4;
    expect(() => drawBiomorph(mockCtx, testGenome, 400, 300, 1.0)).not.toThrow();

    testGenome.eyeCount = 6;
    expect(() => drawBiomorph(mockCtx, testGenome, 400, 300, 1.5)).not.toThrow();

    // Test with antenna tip types and limb tip types
    testGenome.antennaTip = 'feather';
    testGenome.antennaCount = 1;
    testGenome.markingsStyle = 'chevrons';
    testGenome.limbPairs[0].tipType = 'glow-orb';
    expect(() => drawBiomorph(mockCtx, testGenome, 400, 300, 2.0)).not.toThrow();

    testGenome.antennaTip = 'beaded';
    testGenome.markingsStyle = 'dots';
    testGenome.limbPairs[0].tipType = 'pad';
    expect(() => drawBiomorph(mockCtx, testGenome, 400, 300, 2.5)).not.toThrow();
  });
});
