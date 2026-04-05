// src/features/Sounds/Types.ts

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  category: string;
}

export const defaultAmbient = [
  { id: 'rain', name: 'Rain', icon: '🌧️', color: '#5bc0eb', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Rain_on_roof_and_thunder.ogg' },
  { id: 'fire', name: 'Fireplace', icon: '🔥', color: '#f1a25e', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Crackling_fire.ogg' },
  { id: 'cafe', name: 'Cafe', icon: '☕', color: '#fdcb58', url: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Restaurant_ambience.ogg' },
  { id: 'forest', name: 'Forest', icon: '🌲', color: '#78b159', url: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Wind_in_the_trees.ogg' }
];