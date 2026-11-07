import React from "react";

export interface PillNavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
}

export interface PillNavProps {
  logo?: React.ReactNode | string;
  logoAlt?: string;
  logoHref?: string;
  items?: PillNavItem[];
  activeHref?: string;
  defaultActiveIndex?: number;
  onItemClick?: (item: PillNavItem, index: number, event: React.MouseEvent) => void;
  linkComponent?: React.ComponentType<any> | string;
  theme?: "dark" | "light";
  layout?: "split" | "joined";
  size?: "sm" | "md" | "lg";
  surface?: "glass" | "solid" | "none";
  itemStyle?: "pill" | string;
  hoverEffect?: "fill" | "glide";
  indicator?: "dot" | "pill";
  highlightColor?: string;
  highlightTextColor?: string;
  barColor?: string;
  textColor?: string;
  bounce?: number;
  stretch?: number;
  intro?: boolean;
  collapse?: "auto" | "always" | "never";
  onMenuToggle?: (open: boolean) => void;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

declare const PillNav: React.FC<PillNavProps>;
export default PillNav;
