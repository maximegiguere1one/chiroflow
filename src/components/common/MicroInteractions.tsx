import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { ReactNode, useState } from 'react';

export function HoverScale({
  children,
  scale = 1.05,
  duration = 0.2
}: {
  children: ReactNode;
  scale?: number;
  duration?: number;
}) {
  return (
    <motion.div
      whileHover={{ scale }}
      transition={{ duration }}
    >
      {children}
    </motion.div>
  );
}

export function TapScale({
  children,
  scale = 0.95,
  duration = 0.1
}: {
  children: ReactNode;
  scale?: number;
  duration?: number;
}) {
  return (
    <motion.div
      whileTap={{ scale }}
      transition={{ duration }}
    >
      {children}
    </motion.div>
  );
}

export function InteractiveButton({
  children,
  onClick,
  className = '',
  ...props
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  [key: string]: any;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function MagneticButton({
  children,
  strength = 0.3,
  className = ''
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    x.set(deltaX);
    y.set(deltaY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PulseOnHover({
  children,
  scale = 1.1,
  duration = 0.6
}: {
  children: ReactNode;
  scale?: number;
  duration?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={isHovered ? {
        scale: [1, scale, 1],
        transition: { duration, repeat: Infinity }
      } : { scale: 1 }}
    >
      {children}
    </motion.div>
  );
}

export function ShakeOnError({
  children,
  trigger
}: {
  children: ReactNode;
  trigger: boolean;
}) {
  const controls = useAnimation();

  const shake = async () => {
    await controls.start({
      x: [-10, 10, -10, 10, 0],
      transition: { duration: 0.5 }
    });
  };

  if (trigger) {
    shake();
  }

  return (
    <motion.div animate={controls}>
      {children}
    </motion.div>
  );
}

export function BounceOnSuccess({
  children,
  trigger
}: {
  children: ReactNode;
  trigger: boolean;
}) {
  const controls = useAnimation();

  const bounce = async () => {
    await controls.start({
      y: [-20, 0, -10, 0],
      transition: { duration: 0.6 }
    });
  };

  if (trigger) {
    bounce();
  }

  return (
    <motion.div animate={controls}>
      {children}
    </motion.div>
  );
}

export function FadeInUp({
  children,
  delay = 0,
  duration = 0.5
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  );
}

export function SlideInFromLeft({
  children,
  delay = 0,
  duration = 0.5
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  );
}

export function SlideInFromRight({
  children,
  delay = 0,
  duration = 0.5
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerChildren({
  children,
  staggerDelay = 0.1
}: {
  children: ReactNode;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

export function RotateOnHover({
  children,
  degrees = 180
}: {
  children: ReactNode;
  degrees?: number;
}) {
  return (
    <motion.div
      whileHover={{ rotate: degrees }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

export function GlowOnHover({
  children,
  color = 'rgba(59, 130, 246, 0.5)',
  size = 20
}: {
  children: ReactNode;
  color?: string;
  size?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered ? `0 0 ${size}px ${color}` : 'none',
        transition: 'box-shadow 0.3s'
      }}
    >
      {children}
    </motion.div>
  );
}

export function SpringButton({
  children,
  onClick,
  className = ''
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17
      }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

export function FloatingElement({
  children,
  duration = 3,
  offset = 10
}: {
  children: ReactNode;
  duration?: number;
  offset?: number;
}) {
  return (
    <motion.div
      animate={{
        y: [-offset, offset, -offset]
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
}

export function LoadingDots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{
            y: [-5, 5, -5]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  );
}

export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-gray-200"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeInOut' }}
        className="text-blue-500"
      />
    </svg>
  );
}

export function CountUp({
  end,
  duration = 2,
  suffix = ''
}: {
  end: number;
  duration?: number;
  suffix?: string;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useState(() => {
    count.set(end);
  });

  return (
    <motion.span>
      {rounded.get()}{suffix}
    </motion.span>
  );
}
