import React from 'react';

export interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  time?: number;
  speed?: number;
  height?: number;
  scale?: number;
  glow?: number;
  brightness?: number;
  layers?: number;
  direction?: 'top' | 'bottom';
  mouseInteraction?: boolean;
  intro?: boolean;
  opacity?: number;
  lightMode?: number;
  paused?: boolean;
  dpr?: number;
  className?: string;
  style?: React.CSSProperties;
}

declare const Aurora: React.FC<AuroraProps>;
export default Aurora;
