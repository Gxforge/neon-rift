/* ============================================================
   Modulos de mejora — 24 mejoras con icono pixel propio
   ============================================================ */

export type ModId =
  | 'dmg' | 'aspd' | 'hp' | 'heal' | 'dash' | 'crit' | 'shield' | 'magnet'
  | 'speed' | 'multi' | 'pierce' | 'lifesteal' | 'thorns' | 'lucky' | 'bomb'
  | 'range' | 'longsword' | 'chip' | 'armor' | 'revive' | 'freeze' | 'venom'
  | 'laser' | 'turret';

export interface ModDef {
  id: ModId;
  name: string;
  desc: string;
  rarity: 'comun' | 'raro' | 'epico';
  max: number;
  /** indice dentro de icons_mods.png (8 columnas) */
  icon: number;
}

export const MODS: ModDef[] = [
  { id: 'dmg', name: 'FILO MEJORADO', desc: 'Dano de espada +25%', rarity: 'comun', max: 8, icon: 0 },
  { id: 'aspd', name: 'SOBRECARGA', desc: 'Velocidad de ataque +15%', rarity: 'comun', max: 6, icon: 1 },
  { id: 'hp', name: 'NUCLEO EXTRA', desc: 'Vida maxima +20', rarity: 'comun', max: 6, icon: 2 },
  { id: 'heal', name: 'NANO REPARACION', desc: 'Cura 40 de vida ya', rarity: 'comun', max: 99, icon: 3 },
  { id: 'dash', name: 'ACELERADOR', desc: 'Dash recarga 20% mas rapido', rarity: 'comun', max: 4, icon: 4 },
  { id: 'crit', name: 'PUNTO DEBIL', desc: '+8% probabilidad de critico', rarity: 'comun', max: 6, icon: 5 },
  { id: 'shield', name: 'BARRERA', desc: 'Ganas 1 carga de escudo', rarity: 'raro', max: 3, icon: 6 },
  { id: 'magnet', name: 'IMAN DE DATOS', desc: 'Atrae chips desde mas lejos', rarity: 'comun', max: 3, icon: 7 },
  { id: 'speed', name: 'SERVOS', desc: 'Velocidad de movimiento +10%', rarity: 'comun', max: 5, icon: 8 },
  { id: 'multi', name: 'TRIANGULACION', desc: 'Proyectil extra en abanico', rarity: 'raro', max: 3, icon: 9 },
  { id: 'pierce', name: 'PERFORANTE', desc: 'Cortes atraviesan enemigos', rarity: 'raro', max: 2, icon: 10 },
  { id: 'lifesteal', name: 'DRENAJE', desc: '5% del dano se vuelve vida', rarity: 'raro', max: 4, icon: 11 },
  { id: 'thorns', name: 'ESPINAS', desc: 'Devuelve 8 de dano al contacto', rarity: 'raro', max: 4, icon: 12 },
  { id: 'lucky', name: 'SUERTE DE NEON', desc: 'Mejores recompensas', rarity: 'raro', max: 3, icon: 13 },
  { id: 'bomb', name: 'MINA SALTARINA', desc: 'Explosion al entrar a sala', rarity: 'epico', max: 2, icon: 14 },
  { id: 'range', name: 'AMPLIFICADOR', desc: 'Alcance del corte +25%', rarity: 'comun', max: 4, icon: 15 },
  { id: 'longsword', name: 'HOJA LARGA', desc: 'Espada mas grande y letal', rarity: 'raro', max: 2, icon: 16 },
  { id: 'chip', name: 'CHIPS X25', desc: 'Gana 25 chips', rarity: 'comun', max: 99, icon: 17 },
  { id: 'armor', name: 'BLINDAJE', desc: 'Reduce 10% el dano recibido', rarity: 'raro', max: 4, icon: 18 },
  { id: 'revive', name: 'FENIX', desc: 'Revives una vez por run', rarity: 'epico', max: 1, icon: 19 },
  { id: 'freeze', name: 'CRIOGENIA', desc: 'Ralentiza enemigos al golpear', rarity: 'raro', max: 2, icon: 20 },
  { id: 'venom', name: 'VENENO', desc: 'Envenena con cada golpe', rarity: 'raro', max: 3, icon: 21 },
  { id: 'laser', name: 'RAYO OCULAR', desc: 'Laser automatico cada 3s', rarity: 'epico', max: 2, icon: 22 },
  { id: 'turret', name: 'TORRETA', desc: 'Aliado que dispara sola', rarity: 'epico', max: 1, icon: 23 },
];

export const MOD_BY_ID = new Map<ModId, ModDef>(MODS.map(m => [m.id, m]));

const RARITY_W: Record<ModDef['rarity'], number> = { comun: 70, raro: 25, epico: 5 };

export function rollMods(owned: Partial<Record<ModId, number>>, count = 3, luck = 0): ModDef[] {
  const pool = MODS.filter(m => (owned[m.id] ?? 0) < m.max);
  const picks: ModDef[] = [];
  while (picks.length < count && pool.length > 0) {
    let total = 0;
    const w = pool.map(m => {
      const base = RARITY_W[m.rarity] * (m.rarity === 'epico' ? 1 + luck * 0.35 : m.rarity === 'raro' ? 1 + luck * 0.15 : 1);
      total += base;
      return base;
    });
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= w[i];
      if (r <= 0) { idx = i; break; }
    }
    picks.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picks;
}
