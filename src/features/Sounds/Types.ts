// src/features/Sounds/Types.ts

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  category: string;
  thumbnail?: string;
  icon?: string;
  color?: string;
  titleColor?: string;
  artist?: string;
}