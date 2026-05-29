const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const enemyCountLabel = document.getElementById('enemyCount');
const healthCountLabel = document.getElementById('healthCount');
const weaponNameLabel = document.getElementById('weaponName');
const ammoCountLabel = document.getElementById('ammoCount');
const timeLabel = document.getElementById('time');
const gameStateLabel = document.getElementById('gameState');
const restartButton = document.getElementById('restartButton');
const weaponSelect = document.getElementById('weaponSelect');

const TILE_SIZE = 48;
const GRID_WIDTH = 16;
const GRID_HEIGHT = 12;
const PLAYER_SPEED = 2.4; // tiles per second
const BULLET_SPEED = 8; // tiles per second

const WEAPONS = {
  awp: { name: 'AWP', maxAmmo: 5, reloadTime: 2200, fireRate: 700, damage: 2 },
  m4a1s: { name: 'M4A1S', maxAmmo: 30, reloadTime: 1500, fireRate: 120, damage: 1 },
  ak47: { name: 'AK-47', maxAmmo: 30, reloadTime: 1700, fireRate: 140, damage: 1.25 }
};

const map = Array(GRID_HEIGHT).fill('.'.repeat(GRID_WIDTH));

const colors = {
  floor: '#11212f',
  floorAlt: '#142a38',
  player: '#4ad994',
  enemy: '#ff5261',
  bullet: '#ffffff',
  objective: '#ffd166',
  shadow: 'rgba(0,0,0,0.25)',
  hit: 'rgba(255, 80, 80, 0.25)'
};

const player = {
  x: 2.5,
  y: 2.5,
  angle: 0,
  radius: 0.24,
  health: 3,
  ammo: WEAPONS.m4a1s.maxAmmo,
  reloading: false,
  lastShot: 0,
  reloadEnd: 0,
  hitCooldown: 0
};

let currentWeapon = WEAPONS.m4a1s;

const enemies = [
  { x: 12.5, y: 2.5, radius: 0.24, health: 100, maxHealth: 100, alive: true, targetCooldown: 0 },
  { x: 12.5, y: 6.5, radius: 0.24, health: 100, maxHealth: 100, alive: true, targetCooldown: 0 },
  { x: 8.5, y: 9.5, radius: 0.24, health: 100, maxHealth: 100, alive: true, targetCooldown: 0 }
];

const objective = { x: 14.5, y: 10.5, radius: 0.3 };
let bullets = [];
let hitIndicators = [];
let keysPressed = {};
let mouse = { x: 384, y: 288 };
let startTime = null;
let gameOver = false;
let lastFrameTime = 0;

const HEADSHOT_CHANCE = 0.0608;
const BODY_DAMAGE = 100 / 15;
const HEADSHOT_MULTIPLIER = 2.5;

function canMove(x, y, radius) {
  return x - radius >= 0 && x + radius <= GRID_WIDTH && y - radius >= 0 && y + radius <= GRID_HEIGHT;
}

function drawFloorTile(x, y) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  const gradient = ctx.createLinearGradient(px, py, px + TILE_SIZE, py + TILE_SIZE);
  gradient.addColorStop(0, colors.floorAlt);
  gradient.addColorStop(1, colors.floor);
  ctx.fillStyle = gradient;
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
}

function drawMap() {
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      drawFloorTile(x, y);
    }
  }
}

function drawCircle(obj, color, radiusOffset = 0) {
  const cx = obj.x * TILE_SIZE;
  const cy = obj.y * TILE_SIZE;
  ctx.fillStyle = colors.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 10, (obj.radius + radiusOffset) * TILE_SIZE * 0.9, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, (obj.radius + radiusOffset) * TILE_SIZE, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  drawCircle(player, colors.player);
  const muzzleX = player.x * TILE_SIZE + Math.cos(player.angle) * 18;
  const muzzleY = player.y * TILE_SIZE + Math.sin(player.angle) * 18;
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x * TILE_SIZE, player.y * TILE_SIZE);
  ctx.lineTo(muzzleX, muzzleY);
  ctx.stroke();
}

function drawEnemies() {
  enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    drawCircle(enemy, colors.enemy);
    const healthPercent = enemy.health / enemy.maxHealth;
    const barWidth = enemy.radius * TILE_SIZE * 1.8;
    const barHeight = 4;
    const barX = enemy.x * TILE_SIZE - barWidth / 2;
    const barY = enemy.y * TILE_SIZE - enemy.radius * TILE_SIZE - 12;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = healthPercent > 0.5 ? '#4ad994' : healthPercent > 0.25 ? '#ffd166' : '#ff5261';
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
  });
}

function drawBullets() {
  bullets.forEach((bullet) => {
    const x = bullet.x * TILE_SIZE;
    const y = bullet.y * TILE_SIZE;
    const trailLength = Math.max(8, bullet.life * 24);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - bullet.dx * trailLength, y - bullet.dy * trailLength);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = colors.bullet;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawHitIndicators() {
  hitIndicators = hitIndicators.filter((hit) => hit.life > 0);
  hitIndicators.forEach((hit) => {
    const alpha = hit.life / 0.5;
    ctx.fillStyle = `rgba(${hit.isHeadshot ? '255, 200, 0' : '255, 255, 255'}, ${alpha})`;
    ctx.font = `bold ${16 + hit.life * 20}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const x = hit.x * TILE_SIZE;
    const y = hit.y * TILE_SIZE - hit.life * 40;
    ctx.fillText(hit.isHeadshot ? '★ HEADSHOT ★' : hit.damage.toFixed(0), x, y);
    hit.life -= 0.016;
  });
}

function drawObjective() {
  const radius = objective.radius * TILE_SIZE;
  const x = objective.x * TILE_SIZE;
  const y = objective.y * TILE_SIZE;
  ctx.fillStyle = colors.objective;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawCrosshair() {
  const rect = canvas.getBoundingClientRect();
  const x = mouse.x - rect.left;
  const y = mouse.y - rect.top;
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x + 10, y);
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x, y + 10);
  ctx.stroke();
}

function draw() {
  drawMap();
  drawObjective();
  drawEnemies();
  drawBullets();
  drawHitIndicators();
  drawPlayer();
  drawCrosshair();
  if (player.hitCooldown > 0) {
    ctx.fillStyle = colors.hit;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function updatePlayer(dt) {
  const moveX = (keysPressed.ArrowRight || keysPressed.d ? 1 : 0) - (keysPressed.ArrowLeft || keysPressed.a ? 1 : 0);
  const moveY = (keysPressed.ArrowDown || keysPressed.s ? 1 : 0) - (keysPressed.ArrowUp || keysPressed.w ? 1 : 0);
  let length = Math.hypot(moveX, moveY);
  if (length > 0) {
    const vx = (moveX / length) * PLAYER_SPEED * dt;
    const vy = (moveY / length) * PLAYER_SPEED * dt;
    if (canMove(player.x + vx, player.y, player.radius)) player.x += vx;
    if (canMove(player.x, player.y + vy, player.radius)) player.y += vy;
  }
}

function updateAim() {
  const rect = canvas.getBoundingClientRect();
  const x = mouse.x - rect.left;
  const y = mouse.y - rect.top;
  player.angle = Math.atan2(y - player.y * TILE_SIZE, x - player.x * TILE_SIZE);
}

function updateBullets(dt) {
  bullets = bullets.filter((bullet) => {
    bullet.x += bullet.dx * BULLET_SPEED * dt;
    bullet.y += bullet.dy * BULLET_SPEED * dt;
    if (bullet.x < 0 || bullet.x > GRID_WIDTH || bullet.y < 0 || bullet.y > GRID_HEIGHT) return false;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
      if (dist < enemy.radius + 0.12) {
        const isHeadshot = Math.random() < HEADSHOT_CHANCE;
        const damage = isHeadshot ? bullet.baseDamage * HEADSHOT_MULTIPLIER : bullet.baseDamage;
        enemy.health -= damage;
        hitIndicators.push({ x: enemy.x, y: enemy.y - 0.3, damage, isHeadshot, life: 0.5 });
        if (enemy.health <= 0) enemy.alive = false;
        return false;
      }
    }
    return bullet.life > 0;
  }).map((bullet) => ({ ...bullet, life: bullet.life - dt }));
}

function getEnemiesAlive() {
  return enemies.filter((enemy) => enemy.alive).length;
}

function updateEnemies(dt) {
  enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    enemy.targetCooldown -= dt * 1000;
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    const speed = 1.2;
    if (dist < 5 && enemy.targetCooldown <= 0) {
      const vx = (dx / dist) * speed * dt;
      const vy = (dy / dist) * speed * dt;
      if (canMove(enemy.x + vx, enemy.y, enemy.radius)) enemy.x += vx;
      if (canMove(enemy.x, enemy.y + vy, enemy.radius)) enemy.y += vy;
      enemy.targetCooldown = 0.35;
    } else if (enemy.targetCooldown <= 0) {
      const direction = Math.random() < 0.5 ? 1 : -1;
      if (Math.random() < 0.5) {
        const vx = direction * 0.12 * dt;
        if (canMove(enemy.x + vx, enemy.y, enemy.radius)) enemy.x += vx;
      } else {
        const vy = direction * 0.12 * dt;
        if (canMove(enemy.x, enemy.y + vy, enemy.radius)) enemy.y += vy;
      }
      enemy.targetCooldown = 1.2;
    }
    const collision = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (collision < player.radius + enemy.radius + 0.05 && player.hitCooldown <= 0) {
      player.health -= 1;
      player.hitCooldown = 1000;
      if (player.health <= 0) {
        endGame(false, 'Eliminated by enemy');
      } else {
        gameStateLabel.textContent = `Hit! ${player.health} health left`;
      }
    }
  });
}

function shoot() {
  const now = Date.now();
  if (gameOver || player.reloading || now - player.lastShot < currentWeapon.fireRate) return;
  if (player.ammo <= 0) {
    startReload();
    return;
  }
  player.ammo -= 1;
  player.lastShot = now;
  const dx = Math.cos(player.angle);
  const dy = Math.sin(player.angle);
  const baseDamage = BODY_DAMAGE * currentWeapon.damage;
  bullets.push({ x: player.x + dx * 0.4, y: player.y + dy * 0.4, dx, dy, life: 1.4, baseDamage });
  if (player.ammo === 0) startReload();
}

function startReload() {
  if (player.reloading || player.ammo === currentWeapon.maxAmmo) return;
  player.reloading = true;
  player.reloadEnd = Date.now() + currentWeapon.reloadTime;
  gameStateLabel.textContent = 'Reloading...';
}

function checkReload() {
  if (!player.reloading) return;
  if (Date.now() >= player.reloadEnd) {
    player.ammo = currentWeapon.maxAmmo;
    player.reloading = false;
    gameStateLabel.textContent = 'Ready';
  }
}

function updateHUD() {
  enemyCountLabel.textContent = getEnemiesAlive();
  ammoCountLabel.textContent = player.ammo;
  healthCountLabel.textContent = player.health;
  weaponNameLabel.textContent = currentWeapon.name;
}

function setWeapon(name) {
  const weapon = WEAPONS[name];
  if (!weapon) return;
  currentWeapon = weapon;
  player.ammo = weapon.maxAmmo;
  player.reloading = false;
  player.lastShot = 0;
  weaponNameLabel.textContent = weapon.name;
  ammoCountLabel.textContent = player.ammo;
  gameStateLabel.textContent = 'Ready';
}

function endGame(victory, message) {
  gameOver = true;
  gameStateLabel.textContent = victory ? 'Round won!' : message;
}

function gameLoop(timestamp) {
  if (!startTime) startTime = timestamp;
  const delta = timestamp - lastFrameTime;
  const dt = Math.min(delta / 1000, 0.06);
  lastFrameTime = timestamp;

  if (!gameOver) {
    updateAim();
    updatePlayer(dt);
    updateBullets(dt);
    updateEnemies(dt);
    player.hitCooldown = Math.max(0, player.hitCooldown - delta);
    checkReload();
    updateHUD();
    const enemiesLeft = getEnemiesAlive();
    if (enemiesLeft === 0 && Math.hypot(player.x - objective.x, player.y - objective.y) < objective.radius + player.radius) {
      endGame(true, 'Round won!');
    }
  }

  draw();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  player.x = 2.5;
  player.y = 2.5;
  player.angle = 0;
  player.health = 3;
  player.ammo = currentWeapon.maxAmmo;
  player.reloading = false;
  player.hitCooldown = 0;
  bullets = [];
  hitIndicators = [];
  enemies.forEach((enemy, index) => {
    const spawn = [{ x: 12.5, y: 2.5 }, { x: 12.5, y: 6.5 }, { x: 8.5, y: 9.5 }][index];
    enemy.x = spawn.x;
    enemy.y = spawn.y;
    enemy.health = 100;
    enemy.alive = true;
    enemy.targetCooldown = 0;
  });
  startTime = null;
  lastFrameTime = 0;
  gameOver = false;
  gameStateLabel.textContent = 'Ready';
  updateHUD();
  timeLabel.textContent = '0';
}

canvas.addEventListener('mousemove', (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});

canvas.addEventListener('mousedown', (event) => {
  if (event.button === 0) {
    shoot();
  }
});

window.addEventListener('keydown', (event) => {
  keysPressed[event.key] = true;
  if (event.key.toLowerCase() === 'r') startReload();
  if (event.key === 'Enter' && gameOver) resetGame();
});

window.addEventListener('keyup', (event) => {
  keysPressed[event.key] = false;
});

weaponSelect.addEventListener('change', (event) => {
  setWeapon(event.target.value);
});

restartButton.addEventListener('click', resetGame);
setWeapon('m4a1s');
resetGame();
requestAnimationFrame(gameLoop);
