import React from 'react';

export interface TopographyProps {
  color?: string;
  lineCount?: number;
  lineWidth?: number;
  majorLines?: boolean;
  elevation?: number;
  foreground?: number;
  scale?: number;
  detail?: number;
  tilt?: number;
  speed?: number;
  direction?: 'forward' | 'backward' | 'left' | 'right';
  morph?: number;
  glow?: number;
  depthOfField?: number;
  fog?: number;
  brightness?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  hoverEffect?: 'lift' | 'trace' | 'light';
  mouseRadius?: number;
  mouseStrength?: number;
  trail?: number;
  parallax?: number;
  clickEffect?: 'pulse' | 'ripple' | string;
  markers?: 'none' | 'plus' | 'dots';
  glitch?: number;
  intro?: boolean;
  lightMode?: boolean;
  dpr?: number;
  className?: string;
  style?: React.CSSProperties;
}

declare const Topography: React.FC<TopographyProps>;
export default Topography;
