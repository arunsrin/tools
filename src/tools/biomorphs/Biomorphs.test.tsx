import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Biomorphs from './Biomorphs';
import {
  BIOMORPHS_STORAGE_KEY,
  decodeDnaPayload,
  encodeDnaPayload,
} from './biomorphPersistence';
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
  type TerrainType,
  type ThreatType,
} from './biomorphEngine';
import {
  createInitialBiosphere,
  stepBiosphere,
  drawBiosphere,
  addPreyAgent,
  addPredatorAgent,
  respawnPlayer,
  generateExtinctionAdvice,
} from './ecosystemEngine';

describe('Biomorphs Component & Engine', () => {
  const onBackMock = vi.fn();
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });

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
    if (originalClipboardDescriptor) {
      Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor);
    } else {
      delete (navigator as unknown as { clipboard?: Clipboard }).clipboard;
    }
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
    expect(screen.getByText('OFFSPRING 1')).toBeInTheDocument();
    expect(screen.getByText('OFFSPRING 2')).toBeInTheDocument();
    expect(screen.getByTestId('how-to-play-guide')).toBeInTheDocument();
    expect(screen.getAllByText(/active biosphere adaptation:/i)).toHaveLength(2);
    expect(screen.getAllByText(/next-gen mutations:/i)).toHaveLength(2);
    expect(screen.queryByText('← / 1')).not.toBeInTheDocument();
    expect(screen.queryByText('→ / 2')).not.toBeInTheDocument();
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

  it('handles DNA copy to clipboard and DNA import modal', async () => {
    render(<Biomorphs onBack={onBackMock} />);

    // Click Copy DNA
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy dna/i }));
    });
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
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    render(<Biomorphs onBack={onBackMock} />);
    fireEvent.click(screen.getByRole('button', { name: /export hd png/i }));
    expect(clickSpy).toHaveBeenCalledTimes(1);
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

  describe('Living Autonomous Biosphere & Survival Simulation', () => {
    it('switches to Living Biosphere via header tab and launches champion', () => {
      render(<Biomorphs onBack={onBackMock} />);

      // Initially in lab
      expect(screen.getByTestId('ecosystem-bar')).toBeInTheDocument();
      expect(screen.queryByTestId('biosphere-section')).not.toBeInTheDocument();

      // Click Living Biosphere tab
      fireEvent.click(screen.getByRole('tab', { name: /living biosphere/i }));

      // Biosphere stage mounted
      expect(screen.getByTestId('biosphere-section')).toBeInTheDocument();
      expect(screen.getByTestId('biosphere-canvas')).toBeInTheDocument();
      expect(screen.getByTestId('player-energy-val')).toHaveTextContent(/100%/i);
      expect(screen.getByTestId('survival-timer')).toBeInTheDocument();
      expect(screen.getByTestId('biosphere-action-ticker')).toBeInTheDocument();
    });

    it('launches specimen directly into biosphere from candidate card', () => {
      render(<Biomorphs onBack={onBackMock} />);

      const launchAlphaBtn = screen.getByRole('button', { name: /^launch offspring 1:/i });
      fireEvent.click(launchAlphaBtn);

      expect(screen.getByTestId('biosphere-section')).toBeInTheDocument();
      expect(screen.getByTestId('biosphere-action-ticker')).toHaveTextContent(/launched/i);
    });

    it('toggles pause and resume in biosphere via button and spacebar', () => {
      render(<Biomorphs onBack={onBackMock} />);
      fireEvent.click(screen.getByTestId('btn-launch-champion'));

      const pauseBtn = screen.getByTestId('btn-toggle-pause');
      expect(pauseBtn).toHaveTextContent(/pause/i);

      // Click pause
      fireEvent.click(pauseBtn);
      expect(pauseBtn).toHaveTextContent(/resume/i);

      // Keyboard space toggles back to resume
      fireEvent.keyDown(window, { key: ' ' });
      expect(pauseBtn).toHaveTextContent(/pause/i);
    });

    it('changes simulation speed (1x, 2x, 3x)', () => {
      render(<Biomorphs onBack={onBackMock} />);
      fireEvent.click(screen.getByTestId('btn-launch-champion'));

      const speed2Btn = screen.getByRole('button', { name: /^2x$/i });
      fireEvent.click(speed2Btn);
      expect(speed2Btn).toHaveAttribute('aria-pressed', 'true');

      const speed3Btn = screen.getByRole('button', { name: /^3x$/i });
      fireEvent.click(speed3Btn);
      expect(speed3Btn).toHaveAttribute('aria-pressed', 'true');
    });

    it('adds prey and predators interactively to the biosphere', () => {
      render(<Biomorphs onBack={onBackMock} />);
      fireEvent.click(screen.getByTestId('btn-launch-champion'));

      const addPreyBtn = screen.getByRole('button', { name: /\+prey/i });
      fireEvent.click(addPreyBtn);

      const addPredatorBtn = screen.getByRole('button', { name: /\+predator/i });
      fireEvent.click(addPredatorBtn);

      expect(screen.getByTestId('biosphere-section')).toBeInTheDocument();
    });

    it('directs organism target on canvas click', () => {
      render(<Biomorphs onBack={onBackMock} />);
      fireEvent.click(screen.getByTestId('btn-launch-champion'));

      const canvas = screen.getByTestId('biosphere-canvas');
      fireEvent.click(canvas, { clientX: 200, clientY: 150 });
      expect(canvas).toBeInTheDocument();
    });

    it('returns to breeding lab via back button and preserves state', () => {
      render(<Biomorphs onBack={onBackMock} />);
      fireEvent.click(screen.getByTestId('btn-launch-champion'));
      expect(screen.getByTestId('biosphere-section')).toBeInTheDocument();

      // Return to lab
      fireEvent.click(screen.getByTestId('btn-back-to-lab'));
      expect(screen.getByTestId('ecosystem-bar')).toBeInTheDocument();
      expect(screen.queryByTestId('biosphere-section')).not.toBeInTheDocument();
    });

    it('supports keyboard shortcut L to toggle between Lab and Biosphere', () => {
      render(<Biomorphs onBack={onBackMock} />);

      // In Lab: press L to launch
      fireEvent.keyDown(window, { key: 'l' });
      expect(screen.getByTestId('biosphere-section')).toBeInTheDocument();

      // In Biosphere: press L to return to Lab
      fireEvent.keyDown(window, { key: 'l' });
      expect(screen.getByTestId('ecosystem-bar')).toBeInTheDocument();
    });

    it('initializes biosphere state with scaled player speed and population', () => {
      const eco: EcosystemConfig = { terrain: 'canopy', climate: 'oxygen', threat: 'airborne' };
      const genome = createPrimordialGenome();
      genome.limbPairs[0].tipType = 'wing';

      const state = createInitialBiosphere(genome, eco, 800, 500);
      expect(state.playerAgent).not.toBeNull();
      expect(state.playerAgent?.role).toBe('player');
      expect(state.playerAgent?.energy).toBe(100);
      expect(state.agents.filter((a) => a.role === 'prey').length).toBe(8);
      expect(state.agents.filter((a) => a.role === 'predator').length).toBe(2);
      expect(state.agents.filter((a) => a.role === 'rival').length).toBe(3);
      expect(state.particles.length).toBeGreaterThan(0);

      // Verify dynamic agent addition
      const withMorePrey = addPreyAgent(state, 800, 500);
      expect(withMorePrey.agents.filter((a) => a.role === 'prey').length).toBe(9);

      const withMorePredator = addPredatorAgent(withMorePrey, 800, 500);
      expect(withMorePredator.agents.filter((a) => a.role === 'predator').length).toBe(3);
    });

    it('steps simulation and drains metabolism over time', () => {
      const eco: EcosystemConfig = { terrain: 'swamp', climate: 'frost', threat: 'stalkers' };
      const genome = createPrimordialGenome();
      const state = createInitialBiosphere(genome, eco, 800, 500);

      const next = stepBiosphere(state, 1.0, 800, 500);
      expect(next.elapsedSeconds).toBe(1.0);
      expect(next.playerAgent?.energy).toBeLessThan(100);
    });

    it('handles feeding collision when player touches prey', () => {
      const eco: EcosystemConfig = { terrain: 'abyss', climate: 'darkness', threat: 'parasites' };
      const genome = createPrimordialGenome();
      const state = createInitialBiosphere(genome, eco, 800, 500);

      // Force player energy down and place a prey right next to player
      if (state.playerAgent) {
        state.playerAgent.energy = 50;
      }
      const prey = state.agents.find((a) => a.role === 'prey');
      if (prey && state.playerAgent) {
        prey.x = state.playerAgent.x + 5;
        prey.y = state.playerAgent.y + 5;
      }

      const stepped = stepBiosphere(state, 0.1, 800, 500);
      expect(stepped.preyEaten).toBe(1);
      expect(stepped.playerAgent?.energy).toBeCloseTo(67.88, 1);
      const steppedPrey = stepped.agents.find((a) => a.id === prey?.id);
      expect(steppedPrey?.isAlive).toBe(false);
    });

    it('triggers extinction when player energy reaches 0', () => {
      const eco: EcosystemConfig = { terrain: 'desert', climate: 'geothermal', threat: 'stalkers' };
      const genome = createPrimordialGenome();
      const state = createInitialBiosphere(genome, eco, 800, 500);

      // Force energy almost zero
      if (state.playerAgent) {
        state.playerAgent.energy = 0.5;
      }

      const stepped = stepBiosphere(state, 2.0, 800, 500);
      expect(stepped.isExtinct).toBe(true);
      expect(stepped.playerAgent?.isAlive).toBe(false);
      expect(stepped.extinctionReason).toMatch(/energy depletion/i);

      // Respawn restores health
      const respawned = respawnPlayer(stepped, 800, 500);
      expect(respawned.isExtinct).toBe(false);
      expect(respawned.playerAgent?.isAlive).toBe(true);
      expect(respawned.playerAgent?.energy).toBe(100);
    });

    it('generates tailored extinction advice based on environment', () => {
      const genome = createPrimordialGenome();

      const airborneAdvice = generateExtinctionAdvice(
        genome,
        { terrain: 'canopy', climate: 'oxygen', threat: 'airborne' },
        'devoured by airborne hunters'
      );
      expect(airborneAdvice.advice).toMatch(/airborne swarms/i);

      const stalkersAdvice = generateExtinctionAdvice(
        genome,
        { terrain: 'swamp', climate: 'acidic', threat: 'stalkers' },
        'ambushed'
      );
      expect(stalkersAdvice.advice).toMatch(/apex stalkers/i);
    });

    it('drawBiosphere executes without errors across biomes', () => {
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        clearRect: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
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
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        setLineDash: vi.fn(),
        createRadialGradient: vi.fn(() => ({
          addColorStop: vi.fn(),
        })),
        createLinearGradient: vi.fn(() => ({
          addColorStop: vi.fn(),
        })),
      } as unknown as CanvasRenderingContext2D;

      const eco: EcosystemConfig = { terrain: 'cavern', climate: 'geothermal', threat: 'stalkers' };
      const genome = createPrimordialGenome();
      const state = createInitialBiosphere(genome, eco, 800, 500);

      expect(() => drawBiosphere(mockCtx, state, 800, 500, 1.0)).not.toThrow();
    });

    it('renders all 6 terrain backdrops with environmental flora and features without errors', () => {
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        clearRect: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
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
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        setLineDash: vi.fn(),
        createRadialGradient: vi.fn(() => ({
          addColorStop: vi.fn(),
        })),
        createLinearGradient: vi.fn(() => ({
          addColorStop: vi.fn(),
        })),
      } as unknown as CanvasRenderingContext2D;

      const terrains: TerrainType[] = ['swamp', 'canopy', 'crags', 'desert', 'abyss', 'cavern'];
      const genome = createPrimordialGenome();

      terrains.forEach((terrain) => {
        const state = createInitialBiosphere(genome, { terrain, climate: 'oxygen', threat: 'stalkers' }, 800, 500);
        expect(() => drawBiosphere(mockCtx, state, 800, 500, 1.5)).not.toThrow();
      });
    });

    it('generates predators with fangs, serrated jaws, or needle proboscis and dorsal serrations', () => {
      const threats: ThreatType[] = ['stalkers', 'airborne', 'parasites'];
      threats.forEach((th) => {
        const state = createInitialBiosphere(createPrimordialGenome(), { terrain: 'swamp', climate: 'acidic', threat: th }, 800, 500);
        const predator = state.agents.find((a) => a.role === 'predator');
        expect(predator).toBeDefined();
        expect(predator?.genome.serrations).toBe(true);
        expect(['fangs', 'serrated-jaws', 'proboscis', 'mandibles']).toContain(predator?.genome.headApparatus);
      });
    });

    it('selects offspring when clicking the Select as Champion button without event bubbling duplicates', () => {
      render(<Biomorphs onBack={onBackMock} />);
      const selectBtn = screen.getByRole('button', { name: /^select offspring 1: .* as champion$/i });
      fireEvent.click(selectBtn);
      expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 1/i);

      // Lineage timeline must have exactly 2 nodes: initial Gen 0 + chosen Gen 1 (no duplicate from bubbling)
      const timeline = screen.getByTestId('lineage-timeline');
      expect(timeline.children).toHaveLength(2);
    });

    it('auto-replenishes prey population when count drops below floor or is depleted', () => {
      const eco: EcosystemConfig = { terrain: 'swamp', climate: 'oxygen', threat: 'stalkers' };
      const genome = createPrimordialGenome();
      let state = createInitialBiosphere(genome, eco, 800, 500);

      // Manually simulate all prey being devoured
      state.agents = state.agents.map((a) => (a.role === 'prey' ? { ...a, isAlive: false } : a));
      expect(state.agents.filter((a) => a.role === 'prey' && a.isAlive)).toHaveLength(0);

      // Step simulation: auto-replenishment should kick in immediately
      state = stepBiosphere(state, 0.1, 800, 500);
      const activePreyAfter = state.agents.filter((a) => a.role === 'prey' && a.isAlive);
      expect(activePreyAfter.length).toBeGreaterThan(0);
      expect(state.actionLog[0]).toMatch(/bio-spore germinated/i);
    });

    it('enables apex predator counter-strike and devouring of hostile native predators', () => {
      const eco: EcosystemConfig = { terrain: 'crags', climate: 'geothermal', threat: 'stalkers' };
      const apexGenome = createPrimordialGenome();
      apexGenome.headApparatus = 'fangs';
      apexGenome.serrations = true;
      let state = createInitialBiosphere(apexGenome, eco, 800, 500);

      if (state.playerAgent) {
        state.playerAgent.fitness = 95;
        state.playerAgent.energy = 50;
      }

      // Position a predator right on top of the apex player
      const predator = state.agents.find((a) => a.role === 'predator');
      if (predator && state.playerAgent) {
        predator.x = state.playerAgent.x + 5;
        predator.y = state.playerAgent.y + 5;
      }

      state = stepBiosphere(state, 0.1, 800, 500);
      expect(state.predatorsRepelled).toBe(1);
      // Apex player gains energy from devouring predator (+35 minus minor dt drain)
      expect(state.playerAgent?.energy).toBeGreaterThan(80);
      expect(state.actionLog.some((m) => /apex counter-strike! devoured/i.test(m))).toBe(true);
      // Hostile predator is slain
      const predatorAfter = state.agents.find((a) => a.id === predator?.id);
      expect(predatorAfter?.isAlive ?? false).toBe(false);
    });
  });

  describe('Resilience, Accessibility, Keyboard Guards & Lifecycle', () => {
    it('handles corrupted localStorage JSON and invalid parentGenome schema gracefully', () => {
      localStorage.setItem(BIOMORPHS_STORAGE_KEY, '{corrupt json');
      expect(() => render(<Biomorphs onBack={onBackMock} />)).not.toThrow();
      expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 0/i);

      localStorage.setItem(
        BIOMORPHS_STORAGE_KEY,
        JSON.stringify({
          parentGenome: { id: 'bad-id', name: 'Broken' },
          lineage: [{ id: 'also-broken' }],
          ecosystem: { terrain: 'invalid', climate: 'invalid', threat: 'invalid' },
        })
      );
      expect(() => render(<Biomorphs onBack={onBackMock} />)).not.toThrow();
    });

    it('tolerates localStorage getItem and setItem exceptions without throwing', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => {
        render(<Biomorphs onBack={onBackMock} />);
        fireEvent.click(screen.getByTestId('specimen-alpha-card'));
      }).not.toThrow();
      expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 1/i);
    });

    it('shows inline alert inside modal on invalid DNA base64, JSON, and missing schema fields', () => {
      render(<Biomorphs onBack={onBackMock} />);
      fireEvent.click(screen.getByRole('button', { name: /import dna/i }));

      const textarea = screen.getByPlaceholderText(/paste base64 dna sequence/i);
      const loadBtn = screen.getByRole('button', { name: /^load dna$/i });

      // Invalid base64
      fireEvent.change(textarea, { target: { value: '!!!not-base64!!!' } });
      fireEvent.click(loadBtn);
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to parse dna string/i);

      // Valid base64 but invalid JSON
      fireEvent.change(textarea, { target: { value: btoa('{bad json') } });
      fireEvent.click(loadBtn);
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to parse dna string/i);

      // Valid base64 JSON missing segments/limbPairs
      fireEvent.change(textarea, {
        target: { value: btoa(JSON.stringify({ id: 'x', name: 'Incomplete', generation: 1 })) },
      });
      fireEvent.click(loadBtn);
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid genome dna format/i);
    });

    it('encodes and decodes UTF-8 DNA payloads cleanly and surfaces clipboard errors', async () => {
      const utf8Genome = createPrimordialGenome();
      utf8Genome.name = 'Xeno🧬Rex · G3';
      utf8Genome.generation = 3;

      const encoded = encodeDnaPayload(utf8Genome);
      const decoded = decodeDnaPayload(encoded);
      expect(decoded?.name).toBe('Xeno🧬Rex · G3');

      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockRejectedValue(new Error('Permission denied')) },
        configurable: true,
      });

      render(<Biomorphs onBack={onBackMock} />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /copy dna/i }));
      });

      expect(screen.getByRole('alert')).toHaveTextContent(/could not copy dna payload/i);
    });

    it('closes DNA modal on Escape, restores focus, and disables global shortcuts while modal is open', () => {
      render(<Biomorphs onBack={onBackMock} />);

      const importBtn = screen.getByRole('button', { name: /import dna/i });
      importBtn.focus();
      fireEvent.click(importBtn);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Global shortcuts ('1', '2', 'r', 'l') must NOT fire while DNA modal is open
      fireEvent.keyDown(window, { key: '1' });
      fireEvent.keyDown(window, { key: 'l' });
      expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 0/i);
      expect(screen.queryByTestId('biosphere-section')).not.toBeInTheDocument();

      // Escape closes DNA modal and restores focus to Import DNA trigger
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(importBtn).toHaveFocus();
    });

    it('ignores global keyboard shortcuts when focus is inside inputs or selects', () => {
      render(<Biomorphs onBack={onBackMock} />);

      const terrainSelect = screen.getByRole('combobox', { name: /terrain/i });
      fireEvent.keyDown(terrainSelect, { key: '1' });
      fireEvent.keyDown(terrainSelect, { key: 'l' });

      expect(screen.getByTestId('generation-counter')).toHaveTextContent(/gen 0/i);
      expect(screen.queryByTestId('biosphere-section')).not.toBeInTheDocument();
    });

    it('caps evolutionary lineage history at 25 generations', () => {
      render(<Biomorphs onBack={onBackMock} />);

      for (let i = 0; i < 28; i++) {
        fireEvent.click(screen.getByTestId('specimen-alpha-card'));
      }

      const timeline = screen.getByTestId('lineage-timeline');
      expect(timeline.children).toHaveLength(25);

      const saved = JSON.parse(localStorage.getItem(BIOMORPHS_STORAGE_KEY) || '{}');
      expect(Array.isArray(saved.lineage)).toBe(true);
      expect(saved.lineage).toHaveLength(25);
    });

    it('gates RAF loop strictly to biosphere mode and cancels animation frame on unmount', () => {
      let nextRafId = 10;
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => {
        nextRafId += 1;
        return nextRafId;
      });
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

      const { unmount } = render(<Biomorphs onBack={onBackMock} />);
      // Lab mode must not start a continuous 60fps RAF loop
      expect(rafSpy).not.toHaveBeenCalled();

      // Switching to biosphere starts RAF
      fireEvent.click(screen.getByTestId('btn-launch-champion'));
      expect(rafSpy).toHaveBeenCalledTimes(1);

      unmount();
      expect(cancelSpy).toHaveBeenCalledWith(11);
    });

    it('uses non-nested accessible markup for SpecimenCard and native buttons for LineageThumbnail', () => {
      render(<Biomorphs onBack={onBackMock} />);

      const alphaCard = screen.getByTestId('specimen-alpha-card');
      expect(alphaCard.tagName).toBe('ARTICLE');
      expect(alphaCard).not.toHaveAttribute('role', 'button');

      const timeline = screen.getByTestId('lineage-timeline');
      expect(timeline.firstElementChild?.tagName).toBe('BUTTON');
    });
  });
});
