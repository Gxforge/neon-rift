/* ============================================================
   Progresion del jugador + estadisticas derivadas de modulos
   ============================================================ */
import type { ModId } from './mods';

export interface Stats {
  dmgMult: number;
  attackRate: number;   // ataques por segundo
  maxHp: number;
  dashCd: number;
  critChance: number;
  critMult: number;
  speedMult: number;
  magnetR: number;
  shieldCharges: number;
  multiShot: number;
  pierce: number;
  lifesteal: number;
  thorns: number;
  rangeMult: number;
  longSword: number;
  armor: number;
  revive: number;
  freeze: number;
  venom: number;
  laser: number;
  turret: number;
  bomb: number;
  luck: number;
}

export class Progress {
  hp = 100;
  maxHp = 100;
  chips = 0;
  mods: Partial<Record<ModId, number>> = {};

  reset() {
    this.chips = 0;
    this.mods = {};
    this.maxHp = 100;
    this.hp = 100;
  }

  add(id: ModId) {
    this.mods[id] = (this.mods[id] ?? 0) + 1;
  }

  get hasRevive() { return (this.mods.revive ?? 0) > 0; }

  stats(): Stats {
    const m = this.mods;
    return {
      dmgMult: 1 + 0.25 * (m.dmg ?? 0) + 0.15 * (m.longsword ?? 0),
      attackRate: 2.2 * (1 + 0.15 * (m.aspd ?? 0)),
      maxHp: 100 + 20 * (m.hp ?? 0),
      dashCd: 1.15 * Math.pow(0.8, m.dash ?? 0),
      critChance: 0.05 + 0.08 * (m.crit ?? 0),
      critMult: 2,
      speedMult: 1 + 0.10 * (m.speed ?? 0),
      magnetR: 26 + 22 * (m.magnet ?? 0),
      shieldCharges: m.shield ?? 0,
      multiShot: m.multi ?? 0,
      pierce: m.pierce ?? 0,
      lifesteal: 0.05 * (m.lifesteal ?? 0),
      thorns: 8 * (m.thorns ?? 0),
      rangeMult: 1 + 0.25 * (m.range ?? 0),
      longSword: m.longsword ?? 0,
      armor: Math.min(0.5, 0.10 * (m.armor ?? 0)),
      revive: m.revive ?? 0,
      freeze: m.freeze ?? 0,
      venom: m.venom ?? 0,
      laser: m.laser ?? 0,
      turret: m.turret ?? 0,
      bomb: m.bomb ?? 0,
      luck: m.lucky ?? 0,
    };
  }
}

/** Coste de la tienda entre pisos (no rompe el ritmo: barato). */
export function healCost(chips: number, missing: number): number {
  return Math.max(15, Math.round(missing * 0.6) + Math.floor(chips * 0.0));
}
