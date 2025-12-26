export interface CarControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
}

export interface PortfolioItem {
  title: string;
  subtitle?: string;
  date?: string;
  description: string;
  details?: string[];
  link?: string;
  linkText?: string;
}

export interface PortfolioSection {
  id: string;
  title: string;
  color: string;
  position: [number, number, number];
  items: PortfolioItem[];
}

export enum CarColor {
  NEON_BLUE = '#00f3ff',
  NEON_PINK = '#ff00ff',
  DARK_METAL = '#222222'
}
