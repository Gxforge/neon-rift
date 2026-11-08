import { chromium } from 'playwright';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', e => console.log('ERR:', (e.message||'').slice(0,150)));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1400);
await page.keyboard.press('Enter');
await page.waitForTimeout(1000);
const res = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.doMelee(s.player.x, s.player.y, 1, s.prog.stats());
  const bolt = s.playerBolts.all.find(b => b.active);
  const p0 = bolt ? { x: bolt.x, y: bolt.y, vx: bolt.body.velocity.x, active: bolt.active, visible: bolt.visible } : null;
  await new Promise(r => setTimeout(r, 300));
  const p1 = bolt ? { x: bolt.x, y: bolt.y, active: bolt.active } : null;
  return { p0, p1, grupo: !!s.playerBoltGroup, enGrupo: s.playerBoltGroup ? s.playerBoltGroup.contains(bolt) : null };
});
console.log(JSON.stringify(res, null, 1));
await b.close();
