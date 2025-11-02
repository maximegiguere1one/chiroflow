export type CelebrationType = 'success' | 'patient' | 'appointment' | 'milestone' | 'achievement';

interface CelebrationConfig {
  particleCount: number;
  spread: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
}

const celebrationConfigs: Record<CelebrationType, CelebrationConfig> = {
  success: {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10b981', '#34d399', '#6ee7b7']
  },
  patient: {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#3b82f6', '#60a5fa', '#93c5fd']
  },
  appointment: {
    particleCount: 50,
    spread: 50,
    origin: { y: 0.6 },
    colors: ['#8b5cf6', '#a78bfa', '#c4b5fd']
  },
  milestone: {
    particleCount: 200,
    spread: 90,
    origin: { y: 0.6 },
    colors: ['#f59e0b', '#fbbf24', '#fcd34d']
  },
  achievement: {
    particleCount: 150,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#ec4899', '#f472b6', '#f9a8d4']
  }
};

export function celebrate(type: CelebrationType = 'success') {
  if (typeof window === 'undefined' || !('confetti' in window)) {
    console.log(`🎉 Celebration: ${type}`);
    return;
  }

  const config = celebrationConfigs[type];

  try {
    (window as any).confetti({
      ...config,
      disableForReducedMotion: true
    });
  } catch (error) {
    console.log(`🎉 Celebration: ${type} (confetti not available)`);
  }
}

export function celebrateCustom(config: Partial<CelebrationConfig>) {
  if (typeof window === 'undefined' || !('confetti' in window)) {
    console.log('🎉 Custom celebration');
    return;
  }

  try {
    (window as any).confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      ...config,
      disableForReducedMotion: true
    });
  } catch (error) {
    console.log('🎉 Custom celebration (confetti not available)');
  }
}
