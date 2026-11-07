import React from 'react';

export interface GridScanProps {
  linesColor?: string;
  scanColor?: string;
  cells?: number;
  lineThickness?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  depth?: number;
  depthFade?: number;
  parallax?: number;
  points?: boolean;
  reflection?: number;
  shading?: number;
  scanDirection?: 'forward' | 'backward' | 'pingpong';
  scanDuration?: number;
  scanDelay?: number;
  scanWidth?: number;
  trail?: number;
  glow?: number;
  autoScan?: boolean;
  interactive?: boolean;
  clickEffect?: 'ping' | 'ripple' | string;
  enableWebcam?: boolean;
  showPreview?: boolean;
  enableGyro?: boolean;
  intro?: boolean;
  lightMode?: boolean;
  dpr?: number;
  className?: string;
  style?: React.CSSProperties;
}

declare const GridScan: React.FC<GridScanProps>;
export default GridScan;
