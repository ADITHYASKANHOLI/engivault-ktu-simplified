import React from 'react';

export interface GradientASCIIProps {
  colors?: string[];
  shape?: 'plane' | 'sphere' | 'torus' | 'wave' | 'cylinder' | 'cone' | 'horizon';
  characters?: string;
  cellSize?: number;
  density?: number;
  glyphOpacity?: number;
  gradientOpacity?: number;
  glow?: number;
  depthOfField?: number;
  flicker?: number;
  softness?: number;
  scale?: number;
  flow?: number;
  speed?: number;
  grain?: number;
  variation?: number;
  mouseInteraction?: boolean;
  scrambleRadius?: number;
  clickEffect?: 'wave' | 'burst' | string;
  intro?: boolean;
  lightMode?: boolean;
  fontFamily?: string;
  dpr?: number;
  className?: string;
  style?: React.CSSProperties;
}

declare const GradientASCII: React.FC<GradientASCIIProps>;
export default GradientASCII;
