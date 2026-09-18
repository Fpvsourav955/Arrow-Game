import React, { useEffect, useState } from 'react';

export interface SparkleBurst {
  id: string;
  x: number;
  y: number;
  color?: string;
}

interface LaunchSparklesProps {
  bursts: SparkleBurst[];
}

export const LaunchSparkles: React.FC<LaunchSparklesProps> = ({ bursts }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-40">
      {bursts.map((burst) => (
        <SingleBurst key={burst.id} burst={burst} />
      ))}
    </div>
  );
};

const SingleBurst: React.FC<{ burst: SparkleBurst }> = ({ burst }) => {
  const [particles] = useState(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const angle = (i / 7) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const speed = 25 + Math.random() * 35;
      const size = 3 + Math.random() * 3.5;
      return {
        id: i,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        size,
      };
    });
  });

  const [active, setActive] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setActive(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${burst.x}px`, top: `${burst.y}px` }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: burst.color || '#38BDF8',
            boxShadow: '0 0 8px rgba(56, 189, 248, 0.9)',
            transform: active
              ? `translate(${p.dx}px, ${p.dy}px) scale(0)`
              : 'translate(0px, 0px) scale(1)',
            opacity: active ? 0 : 1,
            transition: 'transform 420ms cubic-bezier(0.1, 0.8, 0.2, 1), opacity 380ms ease-out',
          }}
        />
      ))}
    </div>
  );
};
