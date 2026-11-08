import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 915, height: 412 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push((e.message||'').slice(0,150)));
await page.goto('https://neon-rift-11l.pages.dev/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
// tap en JUGAR usando coord del juego (canvas 480x270 escalado)
const box = await page.locator('canvas').boundingBox();
const sx = box.width / 480, sy = box.height / 270;
await page.touchscreen.tap(box.x + 240 * sx, box.y + 166 * sy);
await page.waitForTimeout(1800);
const st = await page.evaluate(() => {
  const g = window.__game;
  const s = g.scene.getScene('Game');
  return { scene: g.scene.isActive('Game'), touch: s?.ctrl?.mode, joy: !!s?.ctrl?.leftZone };
});
console.log('MOVIL EN VIVO:', JSON.stringify(st));
await page.screenshot({ path: '/tmp/live_mob.png' });
console.log('errores:', errs.length ? errs : 'NINGUNO');
await b.close();
