// src/features/Sounds/Sounds.ts
import { SoundsUI } from "./SoundsUI";

// Define the state based on the original structure
export interface SoundSettings {
  genericIcon?: string; // lofi, rain, cafe, etc.
  thumbnail?: 'video' | 'custom';
  rotatingTitle?: boolean;
}

export interface SoundItem {
  id: string;
  name: string;
  url: string;
  title?: string; // New field for detailed player
  settings?: SoundSettings; // New field for persistent settings
}

export interface SoundsState {
  activeSoundId: string | null;
  sounds: {
    music: SoundItem[];
    ambient: SoundItem[];
  };
  queue: SoundItem[]; // [New State for Queueing]
}

// Global App State (Preserving original data)
export const appState: SoundsState = {
  activeSoundId: 'ambient1',
  sounds: {
    music: [
      { id: 'music1', name: 'Original Music Sample', url: 'https://youtube...', title: "Video Title One", settings: { rotatingTitle: true, thumbnail: 'video' } },
    ],
    ambient: [
      { id: 'ambient1', name: 'Original Ambient Sample (Rain)', url: '/local/rain.mp3' },
    ],
  },
  queue: [], // Initialize empty queue
};

// Export the init function that main.ts is looking for
export function initSoundsUI() {
  new SoundsUI();
}