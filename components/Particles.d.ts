import React from 'react';

export interface ParticlesProps {
  particleCount?: number;
  particleSpread?: number;
  speed?: number;
  particleColors?: string[];
  moveParticlesOnHover?: boolean;
  particleHoverFactor?: number;
  alphaParticles?: boolean;
  particleBaseSize?: number;
  sizeRandomness?: number;
  cameraDistance?: number;
  shape?: 'circle' | 'square' | 'ring' | 'sparkle';
  glow?: number;
  twinkle?: number;
  depthOfField?: number;
  connections?: boolean;
  connectionDistance?: number;
  hoverEffect?: 'parallax' | 'repel' | 'attract';
  hoverRadius?: number;
  clickBurst?: boolean;
  drift?: 'none' | 'up' | 'down' | 'forward';
  driftSpeed?: number;
  variation?: number;
  intro?: boolean;
  opacity?: number;
  lightMode?: boolean;
  paused?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

declare const Particles: React.FC<ParticlesProps>;
export default Particles;
