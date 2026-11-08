/* ============================================================
   NEON RIFT — configuracion global
   ============================================================ */

export const GAME_W = 480;
export const GAME_H = 270;
export const TILE = 16;
export const ROOM_W = 30;   // tiles de ancho por sala (480 px, una pantalla)
export const ROOM_H = 17;   // tiles de alto por sala (272 px)

export const COLORS = {
  ink: 0x080810,
  cyan: 0x19c8dc,
  cyanLight: 0x8ff7ff,
  magenta: 0xe3279e,
  magentaLight: 0xff7ad9,
  purple: 0x7b3ff2,
  purpleLight: 0xb58cff,
  yellow: 0xffd23f,
  orange: 0xff8b2b,
  red: 0xe0333f,
  redLight: 0xff6b6b,
  green: 0x2fd67b,
  greenLight: 0x96ffc3,
  white: 0xf4f8ff,
  gray: 0x8a93b8,
  darkb: 0x121220,
} as const;

export const CSS = {
  cyan: '#19c8dc',
  cyanLight: '#8ff7ff',
  magenta: '#e3279e',
  magentaLight: '#ff7ad9',
  purple: '#7b3ff2',
  yellow: '#ffd23f',
  orange: '#ff8b2b',
  red: '#e0333f',
  green: '#2fd67b',
  white: '#f4f8ff',
  gray: '#8a93b8',
  steel: '#5b6494',
  dark: '#121220',
} as const;

/** Guardado local (no hay backend; la nube de Supabase queda fuera de alcance). */
export const Store = {
  key: 'neonrift.v1',
  data: {
    bestFloor: 1,
    bestScore: 0,
    totalKills: 0,
    runs: 0,
    muted: false,
    quality: 1, // 1 = normal, 0 = rendimiento
  } as {
    bestFloor: number; bestScore: number; totalKills: number;
    runs: number; muted: boolean; quality: number;
  },

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) Object.assign(this.data, JSON.parse(raw));
    } catch { /* ignora */ }
    return this.data;
  },
  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch { /* ignora */ }
  },
  reset() {
    this.data.bestFloor = 1; this.data.bestScore = 0;
    this.data.totalKills = 0; this.data.runs = 0;
    this.save();
  },
};
Store.load();

export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
  const noHover = window.matchMedia?.('(hover: none)')?.matches ?? false;
  const touch = ('ontouchstart' in window) || (navigator.maxTouchPoints ?? 0) > 0;
  return touch || (coarse && noHover);
};
