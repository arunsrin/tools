import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Biomorphs from './Biomorphs';
import {
  createPrimordialGenome,
  mutateGenome,
  calculateFitness,
  createRandomEcosystem,
  drawBiomorph,
  TERRAINS,
  CLIMATES,
  THREATS,
  type EcosystemConfig,
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

  it('renders header, ecosystem controls bar, duel arena, and bottom dock', () => {
    render(<Biomorphs onBack={onBackMock} />);

    expect(screen.getByRole('heading', { level: 1, name: /biomorphs: the evolutionary watchmaker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();
    expect(screen.getByTestId('ecosystem-bar')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /terrain/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /climate/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /threat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll random ecosystem/i })).toBeInTheDocument();

    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 0/i);
    expect(screen.getByTestId('specimen-alpha-card')).toBeInTheDocument();
    expect(screen.getByTestId('specimen-beta-card')).toBeInTheDocument();
    expect(screen.getByTestId('alpha-fitness-val')).toBeInTheDocument();
    expect(screen.getByTestId('beta-fitness-val')).toBeInTheDocument();
    expect(screen.getByTestId('lineage-timeline')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<Biomorphs onBack={onBackMock} />);
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it('changes terrain, climate, and threat dropdowns and updates ecosystem', () => {
    render(<Biomorphs onBack={onBackMock} />);

    const terrainSelect = screen.getByRole('combobox', { name: /terrain/i });
    fireEvent.change(terrainSelect, { target: { value: 'desert' } });
    expect(terrainSelect).toHaveValue('desert');

    const climateSelect = screen.getByRole('combobox', { name: /climate/i });
    fireEvent.change(climateSelect, { target: { value: 'frost' } });
    expect(climateSelect).toHaveValue('frost');

    const threatSelect = screen.getByRole('combobox', { name: /threat/i });
    fireEvent.change(threatSelect, { target: { value: 'gravity' } });
    expect(threatSelect).toHaveValue('gravity');
  });

  it('generates a new random ecosystem when clicking Random Biosphere', () => {
    render(<Biomorphs onBack={onBackMock} />);
    const randomBtn = screen.getByRole('button', { name: /roll random ecosystem/i });
    fireEvent.click(randomBtn);
    expect(screen.getByText(/new biosphere/i)).toBeInTheDocument();
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

  it('supports keyboard navigation (ArrowLeft, ArrowRight, and R for reset)', () => {
    render(<Biomorphs onBack={onBackMock} />);

    // ArrowLeft selects Alpha
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 1/i);

    // ArrowRight selects Beta
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 2/i);

    // Key R triggers New Genesis
    fireEvent.keyDown(window, { key: 'r' });
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 0/i);
  });

  it('handles DNA copy to clipboard and DNA import modal', () => {
    render(<Biomorphs onBack={onBackMock} />);

    // Click Copy DNA
    fireEvent.click(screen.getByRole('button', { name: /copy dna/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();

    // Click Import DNA
    fireEvent.click(screen.getByRole('button', { name: /import dna/i }));
    expect(screen.getByText(/import creature dna/i)).toBeInTheDocument();

    // Valid Base64 genome input
    const sampleGenome = createPrimordialGenome();
    sampleGenome.generation = 5;
    sampleGenome.name = 'TestMorph Rex · G5';
    const validDna = btoa(JSON.stringify(sampleGenome));

    const textarea = screen.getByPlaceholderText(/paste base64 dna sequence/i);
    fireEvent.change(textarea, { target: { value: validDna } });

    fireEvent.click(screen.getByRole('button', { name: /^load dna$/i }));
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 5/i);
  });

  it('handles HD PNG export trigger', () => {
    render(<Biomorphs onBack={onBackMock} />);
    fireEvent.click(screen.getByRole('button', { name: /export hd png/i }));
    expect(screen.getByText(/exported hd specimen snapshot/i)).toBeInTheDocument();
  });

  it('allows time-travel rewind to ancestor in timeline', () => {
    render(<Biomorphs onBack={onBackMock} />);

    // Select Alpha twice to reach Gen 2
    fireEvent.click(screen.getByTestId('specimen-alpha-card'));
    fireEvent.click(screen.getByTestId('specimen-alpha-card'));
    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 2/i);

    // Click Gen 0 ancestor in timeline
    const gen0Thumb = screen.getByTitle(/gen 0:/i);
    fireEvent.click(gen0Thumb);

    expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 0/i);
    expect(screen.getByText(/rewound to gen 0/i)).toBeInTheDocument();
  });

  it('creates and mutates genomes with new traits (wings and mouthparts)', () => {
    const parent = createPrimordialGenome();
    expect(parent.generation).toBe(0);

    const result = mutateGenome(parent, 'moderate');
    expect(result.child.generation).toBe(1);
    expect(result.mutatedTraits.length).toBeGreaterThan(0);
  });

  it('computes accurate environmental fitness across biomes, climates, and threats', () => {
    const testEco: EcosystemConfig = {
      terrain: 'swamp',
      climate: 'acidic',
      threat: 'stalkers',
    };

    const genome = createPrimordialGenome();
    genome.primaryHue = 120; // Swamp green
    genome.eyeCount = 2;     // Shielded
    genome.limbPairs = [
      { length1: 30, length2: 30, angle1: 0, angle2: 0, thickness: 4, tipType: 'claw' },
      { length1: 30, length2: 30, angle1: 0, angle2: 0, thickness: 4, tipType: 'claw' },
      { length1: 30, length2: 30, angle1: 0, angle2: 0, thickness: 4, tipType: 'claw' },
    ];
    genome.headApparatus = 'proboscis';

    const fit = calculateFitness(genome, testEco);
    expect(fit.score).toBeGreaterThan(70);
    expect(fit.pros).toContain('+Swamp Camouflage');
    expect(fit.pros).toContain('+Mud-Shielded Optics');

    // Test desert fitness
    const desertEco: EcosystemConfig = {
      terrain: 'desert',
      climate: 'geothermal',
      threat: 'scarcity',
    };
    genome.primaryHue = 45; // Gold
    genome.antennaLength = 55;
    const desertFit = calculateFitness(genome, desertEco);
    expect(desertFit.pros).toContain('+Solar UV Heat Deflection');

    // Test canopy fitness with wings
    const canopyEco: EcosystemConfig = {
      terrain: 'canopy',
      climate: 'oxygen',
      threat: 'airborne',
    };
    genome.limbPairs[0].tipType = 'wing';
    const canopyFit = calculateFitness(genome, canopyEco);
    expect(canopyFit.pros).toContain('+Canopy Glider Wings');
  });

  it('drawBiomorph renders wings, proboscis, and mandibles without errors', () => {
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
    testGenome.limbPairs[0].tipType = 'wing';
    testGenome.headApparatus = 'proboscis';

    expect(() => drawBiomorph(mockCtx, testGenome, 400, 300, 0)).not.toThrow();

    testGenome.headApparatus = 'mandibles';
    testGenome.limbPairs[0].tipType = 'pad';
    expect(() => drawBiomorph(mockCtx, testGenome, 400, 300, 1)).not.toThrow();
  });

  it('createRandomEcosystem returns valid terrain, climate, and threat IDs', () => {
    const eco = createRandomEcosystem();
    expect(TERRAINS.map((t) => t.id)).toContain(eco.terrain);
    expect(CLIMATES.map((c) => c.id)).toContain(eco.climate);
    expect(THREATS.map((th) => th.id)).toContain(eco.threat);
  });
});
