export interface DesignImage {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
}

export interface DesignItem {
  id: string;
  title?: string;
  images: DesignImage[];
  isPublished: boolean;
  order: number;
  createdAt: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'tall';
}

export interface VideoItem {
  id: string;
  title?: string;
  videoUrl: string;
  thumbnailUrl: string;
  alt?: string;
  isPublished: boolean;
  order: number;
  createdAt: string;
  aspectRatio?: 'portrait' | 'landscape' | 'square';
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  label: string;
}

export interface PortfolioInfo {
  name: string;
  title: string;
  intro: string;
  aboutText: string;
  skills: string[];
  contactEmail: string;
  contactPhone: string;
  socialLinks: SocialLink[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

export interface PortfolioData {
  info: PortfolioInfo;
  designs: DesignItem[];
  videos: VideoItem[];
  messages: ContactMessage[];
}
