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
- **Enemy types**:
  - Green (Weak): 60 HP, slower
  - Yellow (Medium): 100 HP, standard
  - Red (Strong): 150 HP, faster
- **Weapon balance**: M4A1S requires 15 bullets to kill, AWP ~7-8 shots, AK-47 ~12 shots
- **Headshots**: 6.08% chance per shot (4x damage multiplier)
- **Hit indicators**: Damage numbers float up, special "★ HEADSHOT ★" text for critical hits
- **Health bars**: Enemy health bars appear above their heads
- **Enemy AI**: Enemies move toward player and shoot back
- **Respawn**: Enemies respawn 5 seconds after being killed

## Notes
- Open field gameplay with no walls
- Enemies deal progressive damage over multiple hits
- Enemy bullets are slower than player bullets

## Files

- `index.html` — main page
- `styles.css` — styling
- `script.js` — game logic
