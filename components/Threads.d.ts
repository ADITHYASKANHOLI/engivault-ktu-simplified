import React from 'react';

export interface ThreadsProps {
  color?: [number, number, number];
  accentColor?: [number, number, number];
  amplitude?: number;
  distance?: number;
  enableMouseInteraction?: boolean;
  lineCount?: number;
  thickness?: number;
  softness?: number;
  speed?: number;
  waves?: number;
  split?: number;
  fray?: number;
  angle?: number;
  seed?: number;
  parting?: number;
  taper?: number;
  brightness?: number;
  fade?: number;
  opacity?: number;
  paused?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

declare const Threads: React.FC<ThreadsProps>;
export default Threads;
