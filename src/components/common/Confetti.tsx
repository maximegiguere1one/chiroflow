import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

const colors = ['#FFD700', '#FFA500', '#FF6347', '#4169E1', '#32CD32', '#FF1493'];

export const Confetti: React.FC<ConfettiProps> = ({ trigger, onComplete }) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        delay: Math.random() * 0.2
      }));

      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: particle.x,
                y: particle.y,
                rotate: particle.rotation,
                opacity: 1
              }}
              animate={{
                y: window.innerHeight + 100,
                rotate: particle.rotation + 720,
                opacity: [1, 1, 0]
              }}
              transition={{
                duration: 2.5,
                delay: particle.delay,
                ease: 'easeIn'
              }}
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                backgroundColor: particle.color,
                borderRadius: '2px'
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

export const useConfetti = () => {
  const [showConfetti, setShowConfetti] = useState(false);

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 100);
  };

  return { showConfetti, triggerConfetti };
};
