# lasama-in-pace

A simple top-down Counter Strike 2D shooter with free movement and weapon selection.

## Play the game

Open `index.html` in your browser or use a local server.

Controls:
- `WASD` or `Arrow keys` to move
- Mouse to aim
- Left click to shoot
- `R` to reload
- Pick a weapon from the dropdown: `AWP`, `M4A1S`, or `AK-47`
- Goal: eliminate all enemies and reach the objective

## Game mechanics
- **Enemy health**: Each enemy has 100 HP
- **Weapon balance**: M4A1S requires 15 bullets to kill (each bullet ~6.67 dmg), AWP ~7-8 shots, AK-47 ~12 shots
- **Headshots**: 6.08% chance per shot to land a headshot (2.5x damage multiplier)
- **Hit indicators**: Damage numbers float up when you hit an enemy, with special "★ HEADSHOT ★" text for critical hits
- **Health bars**: Enemy health bars appear above their heads

## Notes
- There are no walls in this mode: it is an open field.
- Enemies deal damage over multiple hits instead of one-shotting.

## Files

- `index.html` — main page
- `styles.css` — styling
- `script.js` — game logic
