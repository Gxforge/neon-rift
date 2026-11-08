/* ============================================================
   Generador de mazmorra: salas por piso con rutas y tipos
   ============================================================ */
import Phaser from 'phaser';

export type RoomType = 'start' | 'combat' | 'elite' | 'treasure' | 'boss' | 'secret';

export interface RoomNode {
  gx: number;
  gy: number;
  type: RoomType;
  doors: { n: boolean; s: boolean; e: boolean; w: boolean };
  cleared: boolean;
  visited: boolean;
  id: number;
}

export class Dungeon {
  nodes: RoomNode[] = [];
  current: RoomNode | null = null;
  floor = 1;
  rng: Phaser.Math.RandomDataGenerator;

  constructor(seed: string) {
    this.rng = new Phaser.Math.RandomDataGenerator([seed]);
  }

  generate(floor: number): RoomNode[] {
    this.floor = floor;
    const rng = this.rng;
    this.nodes = [];
    const used = new Map<string, RoomNode>();
    const key = (x: number, y: number) => `${x},${y}`;

    const start: RoomNode = {
      gx: 0, gy: 0, type: 'start',
      doors: { n: false, s: false, e: false, w: false },
      cleared: true, visited: true, id: 0,
    };
    this.nodes.push(start);
    used.set(key(0, 0), start);

    const roomsToMake = 5 + Math.min(4, floor);
    let frontier: RoomNode[] = [start];

    while (this.nodes.length < roomsToMake && frontier.length > 0) {
      const from = frontier[rng.between(0, frontier.length - 1)];
      const dirs = [
        { dx: 0, dy: -1, d: 'n' as const }, { dx: 0, dy: 1, d: 's' as const },
        { dx: 1, dy: 0, d: 'e' as const }, { dx: -1, dy: 0, d: 'w' as const },
      ].sort(() => rng.frac() - 0.5);

      let added = false;
      for (const { dx, dy, d } of dirs) {
        const nx = from.gx + dx, ny = from.gy + dy;
        if (used.has(key(nx, ny))) continue;
        if (Math.abs(nx) > 3 || Math.abs(ny) > 2) continue;
        const node: RoomNode = {
          gx: nx, gy: ny, type: 'combat',
          doors: { n: false, s: false, e: false, w: false },
          cleared: false, visited: false, id: this.nodes.length,
        };
        const opposite = { n: 's', s: 'n', e: 'w', w: 'e' } as const;
        node.doors[opposite[d]] = true;
        from.doors[d] = true;
        this.nodes.push(node);
        used.set(key(nx, ny), node);
        frontier.push(node);
        added = true;
        break;
      }
      if (!added) frontier = frontier.filter(n => n !== from);
    }

    // asignar tipos: el mas lejano del inicio => boss, otro => tesoro/boss segun piso
    const dist = (n: RoomNode) => Math.abs(n.gx) + Math.abs(n.gy);
    const combat = this.nodes.filter(n => n.type === 'combat');
    combat.sort((a, b) => dist(b) - dist(a));
    if (combat.length >= 2) {
      combat[0].type = 'boss';
      if (floor >= 3) combat[1].type = 'elite';
    } else if (combat.length === 1) {
      combat[0].type = 'boss';
    }
    // una sala de tesoro
    const rest = combat.filter(n => n.type === 'combat');
    if (rest.length > 0) {
      rest[rng.between(0, rest.length - 1)].type = 'treasure';
    }
    // una secreta a veces
    const rest2 = combat.filter(n => n.type === 'combat');
    if (rest2.length > 1 && rng.frac() < 0.6) {
      rest2[rng.between(0, rest2.length - 1)].type = 'secret';
    }
    this.current = start;
    return this.nodes;
  }

  neighbors(n: RoomNode): RoomNode[] {
    const out: RoomNode[] = [];
    for (const node of this.nodes) {
      if (Math.abs(node.gx - n.gx) + Math.abs(node.gy - n.gy) === 1) out.push(node);
    }
    return out;
  }

  find(gx: number, gy: number): RoomNode | undefined {
    return this.nodes.find(n => n.gx === gx && n.gy === gy);
  }
}
