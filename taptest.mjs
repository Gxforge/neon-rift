import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 915, height: 412 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push((e.message||'').slice(0,150)));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
// canvas real (elemento canvas, no contenedor)
const cb = await page.locator('canvas').boundingBox();
const sx = cb.width / 480, sy = cb.height / 270;
console.log('canvas box:', JSON.stringify(cb), 'escala', sx.toFixed(2), sy.toFixed(2));
// tap en JUGAR
await page.touchscreen.tap(cb.x + 240 * sx, cb.y + 168 * sy);
await page.waitForTimeout(2000);
const st = await page.evaluate(() => {
  const g = window.__game;
  return { game: g.scene.isActive('Game'), menu: g.scene.isActive('Menu') };
});
console.log('TRAS TAP JUGAR:', JSON.stringify(st));
if (st.game) {
  const t = await page.evaluate(() => {
    const s = window.__game.scene.getScene('Game');
    return { mode: s.ctrl?.mode, joy: !!s.ctrl?.leftZone };
  });
  console.log('CONTROLES:', JSON.stringify(t));
}
await page.screenshot({ path: '/tmp/taptest.png' });
console.log('errores:', errs.length?errs:'NINGUNO');
await b.close();
