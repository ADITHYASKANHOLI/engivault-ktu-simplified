"use client";

import React from "react";
import { CountingNumber } from "@animate-ui/react/primitives/texts/counting-number";

interface AnimatedCountingNumberProps {
  value: number;
  from?: number;
  thousandSeparator?: string;
  decimalPlaces?: number;
  className?: string;
}

export function AnimatedCountingNumber({
  value,
  from = 0,
  thousandSeparator = ",",
  decimalPlaces = 0,
  className,
}: AnimatedCountingNumberProps) {
  return (
    <span className={className}>
      <CountingNumber
        number={value}
        fromNumber={from}
        inView={true}
        inViewOnce={true}
        thousandSeparator={thousandSeparator}
        decimalPlaces={decimalPlaces}
        transition={{ stiffness: 140, damping: 20 }}
      />
    </span>
  );
}

