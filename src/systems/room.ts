/* ============================================================
   Construccion de sala — arena de una pantalla (480 x 272 px)
   Render por canvas a UNA sola textura + rectangulos de colision.
   ============================================================ */
import Phaser from 'phaser';
import { TILE, ROOM_W, ROOM_H, GAME_W } from '../config';
import type { RoomNode } from './dungeon';

export const TILE_NAMES: Record<string, number> = {
  floor_0: 0, floor_1: 1, floor_2: 2, floor_3: 3, floor_4: 4, floor_5: 5,
  floor_6: 6, floor_7: 7, floor_8: 8, floor_9: 9, vent: 10, spikes: 11,
  wallcap_0: 12, wallcap_1: 13, wallcap_2: 14, wallcap_3: 15, wallcap_4: 16,
  wallface_0: 17, wallface_1: 18, wallface_2: 19, wallface_3: 20, plate: 21,
  crate: 22, barrel_red: 23, barrel_green: 24, terminal: 25, server: 26,
  pipe: 27, door_closed: 28, door_open: 29, portal: 30, spawnpad: 31, wallcap_x: 32,
};

const W = ROOM_W;
const H = ROOM_H;
export const FLOOR_ROW = H - 2;
export const FLOOR_Y = FLOOR_ROW * TILE;

export interface DoorInfo {
  node: RoomNode;
  side: 'w' | 'e';
  rect: Phaser.Geom.Rectangle;
  x: number;
  y: number;
  open: boolean;
}

export interface RoomBuild {
  /** imagen unica con el render de la sala */
  visual: Phaser.GameObjects.Image;
  textureKey: string;
  /** rectangulos solidos (muros, plataformas) */
  solids: Phaser.Geom.Rectangle[];
  doors: DoorInfo[];
  spawnPoints: Phaser.Math.Vector2[];
  playerSpawn: Phaser.Math.Vector2;
  props: { x: number; y: number; index: number }[];
}

function tileAt(src: CanvasImageSource, index: number, ctx: CanvasRenderingContext2D,
  dx: number, dy: number) {
  const cols = 12;
  const sx = (index % cols) * TILE;
  const sy = Math.floor(index / cols) * TILE;
  ctx.drawImage(src, sx, sy, TILE, TILE, dx, dy, TILE, TILE);
}

export function buildRoom(scene: Phaser.Scene, node: RoomNode, neighbors: RoomNode[],
  rng: Phaser.Math.RandomDataGenerator): RoomBuild {

  const T = (n: string) => TILE_NAMES[n];

  // ------------- matriz logica -------------
  // -1 = vacio (fondo oscuro), >=0 = tile del tileset
  const grid: number[][] = [];
  for (let y = 0; y < H; y++) {
    const row: number[] = [];
    for (let x = 0; x < W; x++) {
      let v = -1;
      if (y < 2) {
        v = T('wallcap_' + ((x % 3 === 0) ? 1 : 0));
      } else if (y >= H - 2) {
        // suelo: fila superior con tapa metalica, inferior con placas
        v = y === H - 2
          ? T('wallcap_' + (x % 5 === 0 ? 1 : 0))
          : T('wallface_' + ((x * 3 + y) % 2));

      } else if (x < 2 || x >= W - 2) {
        v = T('wallface_' + (rng.frac() < 0.75 ? 0 : rng.between(1, 2)));
      }
      row.push(v);
    }
    grid.push(row);
  }

  // ------------- puertas -------------
  const doors: DoorInfo[] = [];
  const DOOR_H = 4;                          // tiles de alto
  const doorTop = FLOOR_ROW - DOOR_H;        // apoyada en el suelo (fila 13)
  neighbors.slice(0, 2).forEach((nb, i) => {
    const side: 'w' | 'e' = i === 0 ? 'e' : 'w';
    const x0 = side === 'w' ? 0 : W - 2;
    // hueco en el muro desde el techo del hueco hasta el suelo
    for (let dy = 0; dy < DOOR_H; dy++) {
      const yy = doorTop + dy;
      grid[yy][x0] = -1;
      grid[yy][x0 + 1] = -1;
    }
    doors.push({
      node: nb,
      side,
      // zona de transicion: 3 tiles hacia adentro desde el borde
      rect: new Phaser.Geom.Rectangle(
        side === 'w' ? 0 : GAME_W - 3 * TILE,
        doorTop * TILE,
        3 * TILE,
        DOOR_H * TILE + TILE),
      x: side === 'w' ? 10 : GAME_W - 10,
      y: FLOOR_Y - (DOOR_H * TILE) / 2 - 8,
      open: node.cleared || node.type === 'start',
    });
  });

  // ------------- plataformas -------------
  const solids: Phaser.Geom.Rectangle[] = [];
  const platRows = [12, 10, 8];
  const nPlat = 1 + rng.between(0, 2);
  for (let i = 0; i < nPlat; i++) {
    const py = platRows[i % platRows.length];
    const pw = rng.between(4, 6);
    const px = rng.between(5, W - 5 - pw);
    let overlap = false;
    for (let x = px; x < px + pw; x++) if (grid[py][x] >= 12) overlap = true;
    if (overlap) continue;
    for (let x = px; x < px + pw; x++) grid[py][x] = T('wallcap_' + rng.between(0, 4));
    solids.push(new Phaser.Geom.Rectangle(px * TILE, py * TILE, pw * TILE, TILE));
  }

  // ------------- props -------------
  const props: RoomBuild['props'] = [];
  const kinds = ['crate', 'barrel_red', 'barrel_green', 'terminal', 'server', 'pipe'];
  const nProps = 2 + rng.between(0, 2);
  // apoyar props SOBRE plataformas (nunca en el carril del suelo)
  let placed = 0;
  for (const plat of solids) {
    if (placed >= nProps) break;
    if (plat.width < 3 * TILE) continue;
    // posicion en PIXELES dentro de la plataforma
    const margin = 10;
    const px = plat.x + margin + rng.between(0, Math.max(0, plat.width - margin * 2));
    const py = plat.y - 8;              // apoyado sobre la plataforma
    const kind = kinds[rng.between(0, kinds.length - 1)];
    props.push({ x: Math.round(px), y: Math.round(py), index: T(kind) });
    placed++;
  }
  // el resto en las esquinas del suelo (lejos de las puertas)
  for (let i = placed; i < nProps; i++) {
    const tx = i % 2 === 0 ? 3 : W - 4;
    const kind = kinds[rng.between(0, kinds.length - 1)];
    props.push({ x: tx * TILE + 8, y: FLOOR_Y - 8, index: T(kind) });
  }

  // ------------- render a canvas -------------
  const src = scene.textures.get('tileset').getSourceImage() as CanvasImageSource;
  const canvas = document.createElement('canvas');
  canvas.width = W * TILE;
  canvas.height = H * TILE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const RW = canvas.width;
  const RH = canvas.height;

  // --- zona jugable TRANSPARENTE: deja ver el parallax de la ciudad ---
  ctx.clearRect(0, 0, RW, RH);

  // rejilla de guia muy sutil sobre el parallax
  ctx.fillStyle = 'rgba(120, 140, 220, 0.05)';
  for (let x = 2 * TILE; x < RW - 2 * TILE; x += 48) ctx.fillRect(x, 2 * TILE, 1, RH - 4 * TILE);
  for (let y = 2 * TILE; y < RH - 2 * TILE; y += 48) ctx.fillRect(0, y, RW, 1);

  // --- tiles (muros, suelo, plataformas) ---
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = grid[y][x];
      if (v < 0) continue;
      tileAt(src, v, ctx, x * TILE, y * TILE);
    }
  }

  // oscurece TODO lo dibujado para integrarlo con la noche
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(6, 6, 14, 0.42)';
  ctx.fillRect(0, 0, RW, RH);
  ctx.globalCompositeOperation = 'source-over';

  // --- brillo neon del borde superior del suelo ---
  const glowGrad = ctx.createLinearGradient(0, RH - 2 * TILE - 10, 0, RH - 2 * TILE);
  glowGrad.addColorStop(0, 'rgba(25, 200, 220, 0)');
  glowGrad.addColorStop(1, 'rgba(25, 200, 220, 0.55)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(2 * TILE, RH - 2 * TILE - 10, RW - 4 * TILE, 10);
  // linea dura
  ctx.fillStyle = 'rgba(143, 247, 255, 0.55)';
  ctx.fillRect(2 * TILE, RH - 2 * TILE - 1, RW - 4 * TILE, 1);

  // --- marcos de puerta (alineados al suelo) ---
  for (const d of doors) {
    const fx = d.side === 'w' ? 0 : RW - 2 * TILE;
    const fy = doorTop * TILE;            // borde superior del hueco
    const fh = DOOR_H * TILE;
    // dintel
    ctx.fillStyle = '#3a4268';
    ctx.fillRect(fx, fy - 6, 2 * TILE, 6);
    ctx.fillStyle = '#8ff7ff';
    ctx.fillRect(fx + 1, fy - 2, 2 * TILE - 2, 2);
    // jambas verticales
    ctx.fillStyle = '#262b4a';
    ctx.fillRect(fx + (d.side === 'w' ? 0 : 2 * TILE - 3), fy, 3, fh);
    // rejilla de energia tenue dentro del hueco
    ctx.fillStyle = 'rgba(25,200,220,0.10)';
    ctx.fillRect(fx + (d.side === 'w' ? 3 : 0), fy, 2 * TILE - 3, fh);
  }

  const key = `room_${scene.time.now}_${node.id}_${Math.round(Math.random() * 1e6)}`;
  scene.textures.addCanvas(key, canvas);
  const visual = scene.add.image(0, 0, key).setOrigin(0).setDepth(2);

  // ------------- solidos (x, y = esquina superior izquierda) -------------
  const R = (x: number, y: number, w: number, h: number) =>
    solids.push(new Phaser.Geom.Rectangle(x, y, w, h));

  R(0, 0, W * TILE, 2 * TILE);                                // techo
  R(0, (H - 2) * TILE, W * TILE, 2 * TILE);                   // suelo

  // paredes laterales: solo POR ENCIMA del hueco de la puerta
  const gapTop = (FLOOR_ROW - DOOR_H) * TILE;
  const wallH = gapTop - 2 * TILE;
  if (doors.some(d => d.side === 'w') && wallH > 0) R(0, 2 * TILE, 2 * TILE, wallH);
  if (doors.some(d => d.side === 'e') && wallH > 0) R((W - 2) * TILE, 2 * TILE, 2 * TILE, wallH);

  // ------------- spawns -------------
  const spawnPoints: Phaser.Math.Vector2[] = [];
  const spots: [number, number][] = [
    [7, 12], [W - 8, 12], [W / 2, 7], [W / 2 - 6, 12], [W / 2 + 6, 12],
    [8, 5], [W - 9, 5], [5, 14], [W - 6, 14],
  ];
  for (const [sx, sy] of spots) {
    spawnPoints.push(new Phaser.Math.Vector2(Math.floor(sx) * TILE + 8, Math.floor(sy) * TILE + 8));
  }

  const playerSpawn = new Phaser.Math.Vector2(GAME_W / 2, FLOOR_Y - 24);

  return { visual, textureKey: key, solids, doors, spawnPoints, playerSpawn, props };
}
