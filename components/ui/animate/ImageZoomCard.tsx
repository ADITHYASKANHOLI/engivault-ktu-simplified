"use client";

import React from "react";
import { ImageZoom } from "@animate-ui/react/primitives/effects/image-zoom";

interface ImageZoomCardProps {
  children: React.ReactElement;
  zoomScale?: number;
  className?: string;
}

export function ImageZoomCard({
  children,
  zoomScale = 1.05,
  className,
}: ImageZoomCardProps) {
  return (
    <ImageZoom
      zoomScale={zoomScale}
      zoomOnHover={true}
      className={className}
    >
      {children}
    </ImageZoom>
  );
}

