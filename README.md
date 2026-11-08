# NEON RIFT

Roguelike de acción cyberpunk 2D para navegador y Android. 100% pixel art generado por código (sin emojis ni SVG).

## Jugar

- **Web/Android:** abre el juego desplegado en Cloudflare Pages e instálalo desde Chrome (Añadir a pantalla de inicio). Está preparado como PWA en horizontal.
- **Teclado:** A/D mover · ESPACIO saltar · J golpe · K dash · ESC pausa
- **Táctil:** joystick izquierdo + botones GOLPE / SALTO / DASH

## Desarrollo

```bash
npm install
npm run dev        # servidor local
npm run build      # build de producción a dist/
npm run assets     # regenera TODOS los sprite sheets y la fuente bitmap
```

## Generación de arte

Todo el arte está hecho en Python (Pillow), píxel a píxel:

- `tools/pxlib.py` — motor de dibujo (primitivas, contornos, glow, fuente 3x5)
- `tools/gen_characters.py` — jugador (18 frames), 4 enemigos, jefe OVERSEER
- `tools/gen_world.py` — tileset, parallax de ciudad, FX, pickups, props, 24 iconos de mejoras, HUD, logo
- `tools/gen_font.py` — fuente bitmap + overlays CRT
- `tools/build_assets.py` — orquesta todo y genera `public/contact_sheet.png`

Salida: **57 PNG, ~210 KB** en `public/assets/`.

## Sistemas

- Salas-arena de una pantalla con puertas de energía y mapa por piso
- 24 módulos de mejora con rarezas y sinergias (veneno, hielo, láser, torreta, escudo, fénix…)
- 4 tipos de enemigos con IA propia + jefe de 3 fases
- Combate: espada de plasma, proyectiles, dash con esquiva, críticos, magnetismo
- SFX y música sintetizados con WebAudio (cero archivos de audio)
- Guardado local de récord/piso

## Deploy

El repositorio incluye workflow de GitHub Actions para publicar en Cloudflare Pages.
