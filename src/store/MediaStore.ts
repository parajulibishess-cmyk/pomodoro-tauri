import { BaseStore } from './BaseStore';

export interface MediaState {
  bgUrl: string;
  bgOpacity: number;
  bgPresets: any[];
  playlists: any[];
  customSounds: any[];
}

const defaultBgPresets = [
  { name: "Morning", url: "https://vijiatjack.github.io/nookoffice/video-feed/bg_1.gif", type: "image" },
  { name: "Afternoon", url: "https://vijiatjack.github.io/nookoffice/video-feed/bg_2.gif", type: "image" },
  { name: "Evening", url: "https://vijiatjack.github.io/nookoffice/video-feed/bg_3.gif", type: "image" },
  { name: "Night", url: "https://vijiatjack.github.io/nookoffice/video-feed/bg_4.gif", type: "image" },
  { name: "Rainy", url: "https://vijiatjack.github.io/nookoffice/video-feed/bg_5.gif", type: "image" },
  { name: "Coffee", url: "https://vijiatjack.github.io/nookoffice/video-feed/bg_6.gif", type: "image" },
  { name: "Snowy", url: "https://vijiatjack.github.io/nookoffice/video-feed/bg_7.gif", type: "image" },
  { name: "The Roost (YT)", url: "https://youtu.be/bAaW9cf6Yw0", type: "video" }
];

class MediaStore extends BaseStore<MediaState> {
  constructor() {
    super({
      bgUrl: localStorage.getItem('nook_bg_url') || defaultBgPresets[3].url,
      bgOpacity: parseFloat(localStorage.getItem('nook_bg_opacity') || '0.4'),
      bgPresets: JSON.parse(localStorage.getItem('nook_bg_presets') || JSON.stringify(defaultBgPresets)),
      playlists: JSON.parse(localStorage.getItem('nook_playlists') || JSON.stringify([
        { id: 1, name: "Lofi Beats", url: "https://open.spotify.com/embed/playlist/0vvXsWCC9xrXsKd4FyS8kM" },
        { id: 2, name: "Deep Focus", url: "https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ" }
      ])),
      customSounds: JSON.parse(localStorage.getItem('nook_custom_sounds') || '[]')
    });
  }

  protected onStateChange(prevState: MediaState) {
    if (prevState.bgUrl !== this.state.bgUrl) localStorage.setItem('nook_bg_url', this.state.bgUrl);
    if (prevState.bgOpacity !== this.state.bgOpacity) localStorage.setItem('nook_bg_opacity', this.state.bgOpacity.toString());
    if (prevState.bgPresets !== this.state.bgPresets) localStorage.setItem('nook_bg_presets', JSON.stringify(this.state.bgPresets));
    if (prevState.playlists !== this.state.playlists) localStorage.setItem('nook_playlists', JSON.stringify(this.state.playlists));
    if (prevState.customSounds !== this.state.customSounds) localStorage.setItem('nook_custom_sounds', JSON.stringify(this.state.customSounds));
  }
}

export const mediaStore = new MediaStore();