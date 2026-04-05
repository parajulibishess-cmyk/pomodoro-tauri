// src/features/Sounds/tauriHlsLoader.ts

import { fetch } from '@tauri-apps/plugin-http';

export class TauriHlsLoader {
  context: any;
  config: any;
  callbacks: any;
  stats: any;

  constructor(config: any) {
    this.config = config;
    this.stats = this.getDefaultStats();
  }
  
  getDefaultStats() {
    return {
      aborted: false, loaded: 0, total: 0, retry: 0, chunkCount: 0, bwEstimate: 0,
      loading: { start: 0, first: 0, end: 0 },
      parsing: { start: 0, end: 0 },
      buffering: { start: 0, first: 0, end: 0 }
    };
  }

  async load(context: any, _config: any, callbacks: any) {
    this.context = context;
    this.callbacks = callbacks;
    this.stats = { ...this.getDefaultStats(), ...(context.stats || {}) };
    
    if (!this.stats.loading) this.stats.loading = { start: 0, first: 0, end: 0 };
    if (!this.stats.parsing) this.stats.parsing = { start: 0, end: 0 };
    if (!this.stats.buffering) this.stats.buffering = { start: 0, first: 0, end: 0 };
    
    this.stats.loading.start = performance.now();
    context.stats = this.stats;

    try {
      const response = await fetch(context.url, { method: 'GET' });
      this.stats.loading.first = Math.max(performance.now(), this.stats.loading.start);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      let data: string | ArrayBuffer;

      if (context.responseType === 'arraybuffer') {
        data = await response.arrayBuffer();
      } else {
        data = await response.text();
      }
      
      this.stats.loading.end = Math.max(performance.now(), this.stats.loading.first);

      const dataSize = typeof data === 'string' ? data.length : data.byteLength;
      this.stats.loaded = dataSize;
      this.stats.total = dataSize;

      callbacks.onSuccess({ url: context.url, data: data }, this.stats, context);
    } catch (e: any) {
      console.error("TauriHlsLoader Error:", e);
      callbacks.onError({ code: e.status || 500, text: e.message }, context, null);
    }
  }
  
  abort() { if (this.stats) this.stats.aborted = true; }
  destroy() {}
}