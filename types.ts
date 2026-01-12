
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
  techStack?: string[];
  softSkills?: string[];
  socials?: { name: string; url: string; icon: string }[];
  image?: string; // Project thumbnail image path
  githubUrl?: string; // GitHub repository URL
  markdownFile?: string; // Path to markdown file with project details
  tags?: string[]; // Project category tags
}

export interface PortfolioSection {
  id: string;
  title: string;
  color: string;
  position: [number, number, number];
  items: PortfolioItem[];
  modelType?: string; // Identifier for custom 3D assets (e.g., 'default', 'server', 'robot')
}

export enum CarColor {
  SAFETY_YELLOW = '#F2C94C',
  CARBON_FIBER = '#1a1a1a',
  DARK_METAL = '#222222'
}