import { createAudioController, playWithAudio } from '../../shared/utils/audio';

const chimeController = createAudioController();

export async function playChime(isMuted: boolean): Promise<boolean> {
  if (isMuted) return false;

  return playWithAudio(chimeController, (ctx) => {
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(783.99, now + 0.12); // G5
      osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.35); // C6

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      // Explicitly release hardware resources when chime decays
      osc2.onended = () => {
        void chimeController.close();
      };

      osc1.start(now);
      osc1.stop(now + 0.3);
      osc2.start(now + 0.12);
      osc2.stop(now + 1.2);
    } catch (err) {
      void chimeController.close();
      throw err;
    }
  });
}

export async function closeChimeAudio(): Promise<void> {
  await chimeController.close();
}
