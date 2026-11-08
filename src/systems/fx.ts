/* ============================================================
   Texturas procedurales: particulas, halos, tiles de apoyo
   ============================================================ */
import Phaser from 'phaser';
import { CSS } from '../config';

function g(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

function dot(scene: Phaser.Scene, key: string, size: number, color: number, alpha = 1) {
  if (scene.textures.exists(key)) return;
  const gr = g(scene);
  gr.fillStyle(color, alpha);
  gr.fillRect(0, 0, size, size);
  gr.generateTexture(key, size, size);
  gr.destroy();
}

export function buildParticles(scene: Phaser.Scene) {
  dot(scene, 'p_cyan', 2, 0x19c8dc);
  dot(scene, 'p_cyan_l', 2, 0x8ff7ff);
  dot(scene, 'p_mag', 2, 0xe3279e);
  dot(scene, 'p_mag_l', 3, 0xff7ad9);
  dot(scene, 'p_white', 2, 0xf4f8ff);
  dot(scene, 'p_yellow', 2, 0xffd23f);
  dot(scene, 'p_orange', 3, 0xff8b2b);
  dot(scene, 'p_red', 2, 0xe0333f);
  dot(scene, 'p_green', 2, 0x2fd67b);
  dot(scene, 'p_gray', 2, 0x5b6494);
  dot(scene, 'p_purple', 2, 0xb58cff);
  dot(scene, 'p_spark', 1, 0xffffff);

  if (!scene.textures.exists('p_glow')) {
    const s = 32;
    const cv = scene.textures.createCanvas('p_glow', s, s);
    if (cv) {
      const ctx = cv.getContext();
      const grd = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      grd.addColorStop(0, 'rgba(255,255,255,0.9)');
      grd.addColorStop(0.35, 'rgba(255,255,255,0.35)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, s, s);
      cv.refresh();
    }
  }
}

/** Halo de luz (usado en portales, boss, mejoras). */
export function addGlow(scene: Phaser.Scene, x: number, y: number,
  color: number, scale = 1, alpha = 0.5): Phaser.GameObjects.Image {
  const im = scene.add.image(x, y, 'p_glow').setTint(color).setScale(scale).setAlpha(alpha);
  im.setBlendMode(Phaser.BlendModes.ADD);
  return im;
}

/** Tiles solidos auxiliares: 1x1 blanco para particulas y barras. */
export function buildUtility(scene: Phaser.Scene) {
  if (!scene.textures.exists('px')) {
    const gr = g(scene);
    gr.fillStyle(0xffffff, 1);
    gr.fillRect(0, 0, 1, 1);
    gr.generateTexture('px', 1, 1);
    gr.destroy();
  }
  if (!scene.textures.exists('ring16')) {
    const gr = g(scene);
    gr.lineStyle(1, 0xffffff, 1);
    gr.strokeCircle(8, 8, 7);
    gr.generateTexture('ring16', 16, 16);
    gr.destroy();
  }
  if (!scene.textures.exists('diamond')) {
    const gr = g(scene);
    gr.fillStyle(0xffffff, 1);
    gr.fillPoints([
      new Phaser.Math.Vector2(6, 0), new Phaser.Math.Vector2(12, 6),
      new Phaser.Math.Vector2(6, 12), new Phaser.Math.Vector2(0, 6),
    ], true);
    gr.generateTexture('diamond', 12, 12);
    gr.destroy();
  }
}

/** Recorta los 24 iconos de mejoras a texturas individuales. */
export function sliceIcons(scene: Phaser.Scene) {
  const src = scene.textures.get('icons_mods');
  const img = src.getSourceImage();
  const cols = 8;
  for (let i = 0; i < 24; i++) {
    const key = `icon_${i}`;
    if (scene.textures.exists(key)) continue;
    const cv = scene.textures.createCanvas(key, 16, 16);
    if (!cv) continue;
    const ctx = cv.getContext();
    ctx.imageSmoothingEnabled = false;
    const sx = (i % cols) * 16;
    const sy = Math.floor(i / cols) * 16;
    ctx.drawImage(img as CanvasImageSource, sx, sy, 16, 16, 0, 0, 16, 16);
    cv.refresh();
  }
}

/** Texto pixel con la fuente bitmap. */
export const FONT = 'neon';

export function txt(scene: Phaser.Scene, x: number, y: number, text: string,
  size = 8, color: string = CSS.white): Phaser.GameObjects.BitmapText {
  const t = scene.add.bitmapText(x, y, FONT, text, size);
  t.setTint(Phaser.Display.Color.HexStringToColor(color).color);
  return t;
}
