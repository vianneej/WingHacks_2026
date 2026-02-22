// ============================================
//  Aquarium Adventure – main.js
// ============================================

const canvas = document.getElementById('game');
const displayCtx = canvas.getContext('2d');
const chatBubble = document.getElementById('chatBubble');
const startScreen = document.getElementById('startScreen');
const diveInBtn = document.getElementById('diveInBtn');

let gameStarted = false;
let gameLoopStarted = false;

canvas.width = 1200;
canvas.height = 750;

const renderCanvas = document.createElement('canvas');
renderCanvas.width = 400;
renderCanvas.height = 250;

const ctx = renderCanvas.getContext('2d');

ctx.imageSmoothingEnabled = false;
displayCtx.imageSmoothingEnabled = false;

//adding sea creature pngs
const images = {};
function loadImage(name, src) {
  const img = new Image();
  img.src = src;
  images[name] = img;
}
loadImage("axilottle", 'assets/axilottle.png');
loadImage("clownfish", 'assets/clownfish.png');
loadImage("seahorse", 'assets/seahorse.png');
loadImage("downCrab", 'assets/crab(armsDown).png');
loadImage("upCrab", 'assets/crab(armsUP).png');
loadImage("lobster_left", 'assets/lobster_left.png');
loadImage("lobster_right", 'assets/lobster_right.png');
loadImage("Whaleshark", 'assets/whaleshark.png');
loadImage("dorry", 'assets/dorry.png');
loadImage("seastar", 'assets/starfish.png');
loadImage("seaweed", 'assets/NEWseaweed.png');
loadImage("bluecoral", 'assets/bluecoral.png');
loadImage("redcoral", 'assets/redcoral.PNG');
loadImage("seaturtle", 'assets/seaturtle.PNG');

// ── Canvas sizing ──────────────────────────
// function resize() {
//   canvas.width  = Math.min(window.innerWidth - 40, 960);
//   canvas.height = Math.min(window.innerHeight - 120, 600);
// }
// resize();
// window.addEventListener('resize', resize);

// ── Utility helpers ────────────────────────
const rand  = (a, b) => Math.random() * (b - a) + a;
const randI = (a, b) => Math.floor(rand(a, b));
const dist  = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// ── Time tracking ──────────────────────────
let time = 0;      // global animation timer

// ── Bubble particles ───────────────────────
const bubbles = [];
function spawnBubble(x, y) {
  bubbles.push({ x, y, r: rand(2, 5), speed: rand(0.3, 1), alpha: 1 });
}
function updateBubbles() {
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.y -= b.speed;
    b.x += Math.sin(time * 0.05 + i) * 0.3;
    b.alpha -= 0.005;
    if (b.alpha <= 0 || b.y < -10) bubbles.splice(i, 1);
  }
}
function drawBubbles() {
  bubbles.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180,230,255,${b.alpha * 0.5})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(200,240,255,${b.alpha * 0.7})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  });
}

// ── Coral reef structures (PNG sprites) ──────
const coralPlacements = [
  { img: 'bluecoral', x: 35,  w: 33, h: 38 },
  { img: 'redcoral',  x: 95,  w: 31, h: 35 },
  { img: 'bluecoral', x: 160, w: 29, h: 33 },
  { img: 'redcoral',  x: 220, w: 33, h: 38 },
  { img: 'bluecoral', x: 280, w: 27, h: 31 },
  { img: 'redcoral',  x: 340, w: 31, h: 35 },
  { img: 'bluecoral', x: 385, w: 29, h: 33 },
];

function drawCoral() {
  const sandTopY = renderCanvas.height - 50;
  const coralEmbedDepth = 18;
  const floorY = sandTopY + coralEmbedDepth;
  coralPlacements.forEach(c => {
    const img = images[c.img];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, c.x - c.w / 2, floorY - c.h, c.w, c.h);
    }
  });
}

// ── Background – sand, water, plants ───────
const plants = Array.from({ length: 10 }, () => ({
  x: rand(30, 390),
  h: rand(50, 80),
  w: rand(2, 5),
  hue: randI(100, 160),
  phase: rand(0, Math.PI * 2),
  swaySpeed: rand(0.7, 1.25),
  bend: rand(0.07, 0.14),
  drift: rand(0, Math.PI * 2),
}));

const waterPatches = Array.from({ length: 55 }, () => ({
  x: randI(0, 50) * 8,
  y: randI(1, 22) * 8,
  w: randI(2, 7) * 8,
  h: randI(1, 4) * 8,
  tone: randI(0, 5),
  phase: rand(0, Math.PI * 2),
}));

const causticPatches = Array.from({ length: 26 }, () => ({
  x: randI(0, 50) * 8,
  y: randI(2, 24) * 8,
  w: randI(2, 6) * 8,
  h: randI(1, 2) * 8,
  phase: rand(0, Math.PI * 2),
  speed: rand(0.35, 0.85),
}));

const sandPatches = Array.from({ length: 36 }, () => ({
  x: randI(0, 50) * 8,
  y: randI(0, 6) * 8,
  w: randI(2, 6) * 8,
  h: randI(1, 3) * 8,
  tone: randI(0, 4),
  phase: rand(0, Math.PI * 2),
}));

const sandShellBits = Array.from({ length: 65 }, () => ({
  x: rand(10, 390),
  y: rand(2, 44),
  r: rand(1.2, 2.8),
  color: ['#ffd1dc', '#b8f2e6', '#cdb4db', '#f9c74f', '#a0e7e5', '#f7b7a3'][randI(0, 6)],
  phase: rand(0, Math.PI * 2),
}));

function drawBackground() {


  // ── Pixel Water Bands ─────────────────────
const colors = [
  '#bfe9ff',
  '#9edcff',
  '#7fd3ff',
  '#63c5ff',
  '#4ab3f4'
];

const bandHeight = Math.ceil(renderCanvas.height / colors.length);
const waterBottom = renderCanvas.height - 52;

for (let i = 0; i < colors.length; i++) {
  ctx.fillStyle = colors[i];
  ctx.fillRect(
    0,
    i * bandHeight,
    renderCanvas.width,
    bandHeight
  );
}

// ── Pixel Water Patches ──────────────────
for (const patch of waterPatches) {
  if (patch.y + patch.h > waterBottom) continue;
  const driftX = Math.floor(Math.sin(time * 0.006 + patch.phase) * 2) * 2;
  const pulse = 0.11 + Math.sin(time * 0.01 + patch.phase) * 0.04;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = colors[Math.min(colors.length - 1, patch.tone)];
  ctx.fillRect(patch.x + driftX, patch.y, patch.w, patch.h);
}
ctx.globalAlpha = 1;

// ── Water Currents (subtle ribbons) ──────
ctx.globalAlpha = 0.1;
for (let y = 18; y < waterBottom - 10; y += 16) {
  const sway = Math.sin(time * 0.01 + y * 0.12) * 8;
  const drift = (time * 0.45 + y * 0.8) % 24;
  for (let x = -24; x < renderCanvas.width + 24; x += 24) {
    const segW = 12 + Math.floor(Math.sin(time * 0.02 + x * 0.05 + y) * 2);
    ctx.fillStyle = '#dff7ff';
    ctx.fillRect(Math.floor(x + drift + sway), y, segW, 2);
  }
}
ctx.globalAlpha = 1;

// ── Caustic Glints ────────────────────────
for (const patch of causticPatches) {
  const flowX = (time * patch.speed + patch.phase * 20) % (renderCanvas.width + 56) - 28;
  const wobbleY = Math.sin(time * 0.012 + patch.phase) * 3;
  const py = patch.y + wobbleY;
  if (py + patch.h > waterBottom || py < 8) continue;
  ctx.globalAlpha = 0.08 + Math.sin(time * 0.02 + patch.phase) * 0.03;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(Math.floor(flowX), Math.floor(py), patch.w, patch.h);
}
ctx.globalAlpha = 1;

 // Surface shimmer lines
// ── Pixel Water Sparkles ─────────────────
ctx.globalAlpha = 0.2;

for (let i = 0; i < 30; i++) {
  const x = (i * 37 + time * 0.02) % renderCanvas.width;
  const y = (i * 53 + time * 0.01) % renderCanvas.height;

  ctx.fillStyle = 'white';
  ctx.fillRect(Math.floor(x), Math.floor(y), 2, 2);
}

ctx.globalAlpha = 1;

  // Light rays
  // ── Pixel Sun Beams ─────────────────────
ctx.globalAlpha = 0.12;

for (let i = 0; i < 4; i++) {
  const x = 40 + i * 70 + Math.floor(Math.sin(time * 0.002 + i) * 10);
  ctx.fillStyle = 'white';
  ctx.fillRect(x, 0, 20, renderCanvas.height);
}

ctx.globalAlpha = 1;

  // Sandy bottom
  // ── Pixel Sand ───────────────────────────
const sandY = renderCanvas.height - 50;

ctx.fillStyle = '#ffe6b8';
ctx.fillRect(0, sandY, renderCanvas.width, 50);

// Add block variation
for (let x = 0; x < renderCanvas.width; x += 16) {
  const bump = Math.floor(Math.sin(x * 0.1 + time * 0.02) * 3);
  ctx.fillStyle = '#f5c98c';
  ctx.fillRect(x, sandY + bump, 16, 8);
}

// ── Pixel Sand Patches ───────────────────
const sandPatchColors = ['#f5c98c', '#efbe7f', '#e7b36f', '#f9d39d'];
for (const patch of sandPatches) {
  const driftX = Math.floor(Math.sin(time * 0.005 + patch.phase) * 1.5) * 2;
  const bobY = Math.floor(Math.sin(time * 0.008 + patch.phase) * 1);
  const pulse = 0.15 + Math.sin(time * 0.012 + patch.phase) * 0.05;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = sandPatchColors[Math.min(sandPatchColors.length - 1, patch.tone)];
  ctx.fillRect(patch.x + driftX, sandY + patch.y + bobY, patch.w, patch.h);
}
ctx.globalAlpha = 1;

// ── Tiny Shell Bits ───────────────────────
for (const shell of sandShellBits) {
  const shimmer = 0.45 + Math.sin(time * 0.01 + shell.phase) * 0.12;
  const driftY = Math.sin(time * 0.006 + shell.phase) * 0.4;
  ctx.globalAlpha = shimmer;
  ctx.fillStyle = shell.color;
  ctx.beginPath();
  ctx.arc(shell.x, sandY + shell.y + driftY, shell.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = shimmer + 0.2;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(shell.x - shell.r * 0.25, sandY + shell.y + driftY - shell.r * 0.15, shell.r * 0.45, shell.r * 0.3);
}
ctx.globalAlpha = 1;

  // Seaweed / plants (PNG with sway animation)
  const seaweedImg = images['seaweed'];
  plants.forEach(p => {
    if (p.x > renderCanvas.width) return;

    const baseY = renderCanvas.height - 30;
    const currentPush = Math.sin(time * 0.009 + p.drift) * 2.2;
    const microFlow = Math.sin(time * 0.022 + p.phase) * 0.8;
    const swayAngle = Math.sin(time * 0.02 * p.swaySpeed + p.phase) * p.bend + Math.sin(time * 0.01 + p.drift) * 0.03;

    if (seaweedImg && seaweedImg.complete && seaweedImg.naturalWidth > 0) {
      const drawW = p.h * 0.85;
      const drawH = p.h * 1.18;
      ctx.save();
      // Pivot at the bottom-center of the seaweed (rooted in sand)
      ctx.translate(p.x + currentPush + microFlow, baseY);
      ctx.rotate(swayAngle);
      ctx.drawImage(seaweedImg, -drawW / 2, -drawH, drawW, drawH);
      ctx.restore();
    } else {
      // Fallback: simple blocky seaweed
      const sway = Math.floor(Math.sin(time * 0.02 * p.swaySpeed + p.phase) * 3 + currentPush * 0.6);
      ctx.fillStyle = `hsl(${p.hue}, 50%, 50%)`;
      for (let y = 0; y < p.h; y += 6) {
        ctx.fillRect(p.x + sway, baseY - y, 6, 6);
      }
      ctx.fillStyle = `hsl(${p.hue}, 55%, 60%)`;
      for (let y = 12; y < p.h; y += 18) {
        ctx.fillRect(p.x + sway - 6, baseY - y, 6, 6);
        ctx.fillRect(p.x + sway + 6, baseY - y - 4, 6, 6);
      }
    }
  });

  // Ambient bubbles
  if (Math.random() < 0.03) spawnBubble(rand(20, renderCanvas.width - 20), renderCanvas.height - 50);

  // Surface shimmer lines


}

// ── Draw helper: generic fish shape ────────
function drawFish(x, y, size, color, tailColor, dir, wiggle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.55, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Tail
  const tw = Math.sin(wiggle) * 4;
  ctx.beginPath();
  ctx.moveTo(-size * 0.8, 0);
  ctx.lineTo(-size * 1.5 + tw, -size * 0.5);
  ctx.lineTo(-size * 1.5 + tw, size * 0.5);
  ctx.closePath();
  ctx.fillStyle = tailColor;
  ctx.fill();

  // Dorsal fin
  ctx.beginPath();
  ctx.moveTo(-size * 0.2, -size * 0.5);
  ctx.quadraticCurveTo(size * 0.1, -size * 1, size * 0.4, -size * 0.45);
  ctx.fillStyle = tailColor;
  ctx.fill();

  // Eye
  ctx.beginPath();
  ctx.arc(size * 0.45, -size * 0.1, size * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size * 0.5, -size * 0.1, size * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();

  // Mouth
  ctx.beginPath();
  ctx.arc(size * 0.75, size * 0.1, size * 0.08, 0, Math.PI);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

// ── Draw lobster ───────────────────────────
function drawLobster(x, y, size, dir, wiggle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);

  // Body segments
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 1.1, size * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.ellipse(size * 0.3, 0, size * 0.6, size * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail fan
  ctx.fillStyle = '#a93226';
  ctx.beginPath();
  ctx.moveTo(-size * 1.0, 0);
  ctx.lineTo(-size * 1.6, -size * 0.4);
  ctx.lineTo(-size * 1.3, 0);
  ctx.lineTo(-size * 1.6, size * 0.4);
  ctx.closePath();
  ctx.fill();

  // Claws
  for (let s = -1; s <= 1; s += 2) {
    const cw = Math.sin(wiggle + s) * 3;
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.ellipse(size * 1.3 + cw, s * size * 0.35, size * 0.35, size * 0.2, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Arm
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(size * 0.7, s * size * 0.15);
    ctx.lineTo(size * 1.1 + cw, s * size * 0.35);
    ctx.stroke();
  }

  // Eyes on stalks
  for (let s = -1; s <= 1; s += 2) {
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(size * 0.6, s * size * 0.2);
    ctx.lineTo(size * 0.8, s * size * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(size * 0.8, s * size * 0.4, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
  }

  // Legs
  ctx.strokeStyle = '#a93226';
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 1; i++) {
    for (let s = -1; s <= 1; s += 2) {
      ctx.beginPath();
      ctx.moveTo(i * size * 0.3, s * size * 0.35);
      ctx.lineTo(i * size * 0.3 - 4, s * size * 0.65);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// ── Draw octopus ───────────────────────────
function drawOctopus(x, y, size, color, wiggle) {
  ctx.save();
  ctx.translate(x, y);

  // Tentacles
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI + Math.PI * 0.05;
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.18;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const sx = Math.cos(angle) * size * 0.4;
    const sy = size * 0.3;
    ctx.moveTo(sx, sy);
    const wave = Math.sin(wiggle + i * 0.8) * 8;
    const ex = sx + Math.cos(angle) * size * 0.9 + wave;
    const ey = sy + size * 0.8 + Math.sin(wiggle + i) * 5;
    ctx.quadraticCurveTo(sx + wave * 0.5, sy + size * 0.5, ex, ey);
    ctx.stroke();
    // Suction cups
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let t = 0.3; t < 0.9; t += 0.25) {
      const px = sx + (ex - sx) * t + wave * t * 0.3;
      const py = sy + (ey - sy) * t;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Head
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.1, size * 0.55, size * 0.65, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Spots
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.arc(-size * 0.15, -size * 0.3, size * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(size * 0.2, -size * 0.15, size * 0.08, 0, Math.PI * 2); ctx.fill();

  // Eyes
  for (let s = -1; s <= 1; s += 2) {
    ctx.beginPath();
    ctx.ellipse(s * size * 0.22, -size * 0.15, size * 0.15, size * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * size * 0.24, -size * 0.13, size * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
  }

  // Smile
  ctx.beginPath();
  ctx.arc(0, size * 0.05, size * 0.15, 0.1, Math.PI - 0.1);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

// ── Draw jellyfish ─────────────────────────
function drawJellyfish(x, y, size, color, wiggle) {
  ctx.save();
  ctx.translate(x, y);

  // Bell
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.6, size * 0.5, 0, Math.PI, 0);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Inner glow
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.15, size * 0.3, size * 0.25, 0, Math.PI, 0);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fill();

  // Tentacles
  for (let i = -3; i <= 3; i++) {
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const sx = i * size * 0.14;
    ctx.moveTo(sx, size * 0.05);
    const wave = Math.sin(wiggle + i * 0.7) * 6;
    ctx.quadraticCurveTo(sx + wave, size * 0.5, sx + wave * 1.5, size * 1.1 + Math.sin(wiggle + i) * 8);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ── Draw sea star ──────────────────────────
function drawSeaStar(x, y, size, color, wiggle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(wiggle * 0.3) * 0.05);

  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const innerAngle = angle + Math.PI / 5;
    const ox = Math.cos(angle) * size;
    const oy = Math.sin(angle) * size;
    const ix = Math.cos(innerAngle) * size * 0.4;
    const iy = Math.sin(innerAngle) * size * 0.4;
    if (i === 0) ctx.moveTo(ox, oy);
    else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Dots
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * size * 0.45, Math.sin(angle) * size * 0.45, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ── Draw seahorse ──────────────────────────
function drawSeahorse(x, y, size, color, dir, wiggle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);

  // Body curve
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.8);
  ctx.quadraticCurveTo(size * 0.5, -size * 0.3, size * 0.2, size * 0.2);
  ctx.quadraticCurveTo(-size * 0.1, size * 0.6, -size * 0.3, size * 0.9 + Math.sin(wiggle) * 3);
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.ellipse(size * 0.1, -size * 0.85, size * 0.28, size * 0.25, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Snout
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.15;
  ctx.beginPath();
  ctx.moveTo(size * 0.3, -size * 0.85);
  ctx.lineTo(size * 0.6, -size * 0.9);
  ctx.stroke();

  // Eye
  ctx.beginPath();
  ctx.arc(size * 0.15, -size * 0.9, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size * 0.17, -size * 0.9, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();

  // Dorsal fin
  ctx.fillStyle = `${color}88`;
  ctx.beginPath();
  ctx.ellipse(size * 0.35, -size * 0.2, size * 0.2, size * 0.3, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── Draw crab ──────────────────────────────
function drawCrab(x, y, size, wiggle) {
  ctx.save();
  ctx.translate(x, y);

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.8, size * 0.55, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#e67e22';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Claws
  for (let s = -1; s <= 1; s += 2) {
    const cw = Math.sin(wiggle + s) * 4;
    ctx.strokeStyle = '#d35400';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(s * size * 0.7, -size * 0.1);
    ctx.lineTo(s * (size * 1.1 + cw), -size * 0.3);
    ctx.stroke();
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.ellipse(s * (size * 1.2 + cw), -size * 0.35, size * 0.25, size * 0.18, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Legs
  ctx.strokeStyle = '#d35400';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    for (let s = -1; s <= 1; s += 2) {
      const lx = s * (size * 0.3 + i * size * 0.2);
      ctx.beginPath();
      ctx.moveTo(lx, size * 0.3);
      ctx.lineTo(lx + s * 8, size * 0.6 + Math.sin(wiggle + i) * 2);
      ctx.stroke();
    }
  }

  // Eyes
  for (let s = -1; s <= 1; s += 2) {
    ctx.strokeStyle = '#d35400';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s * size * 0.2, -size * 0.45);
    ctx.lineTo(s * size * 0.25, -size * 0.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * size * 0.25, -size * 0.65, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
  }

  ctx.restore();
}

// ── Socialisation dialogue ─────────────────
const greetings = {
  fish: [
    "Blub blub! Nice to see you! 🐟",
    "Race you to the coral!",
    "Have you seen the new seaweed?",
    "You look fin-tastic today!",
    "Wanna play tag? 🏷️",
    "The water's lovely today!",
    "I found a shiny shell!",
    "Let's swim together! 💙",
  ],
  lobster: [
    "Snap snap! Welcome, friend! 🦞",
    "Don't mind my claws, I'm friendly!",
    "I'm guarding this spot. Just kidding!",
    "Need a pinch of humor? 😂",
    "These claws are for hugs only!",
  ],
  octopus: [
    "Eight arms for eight hugs! 🐙",
    "I just changed colour, notice?",
    "Ink-redible to meet you!",
    "Wanna see a magic trick?",
    "I can open any jar!",
  ],
  jellyfish: [
    "I'm just going with the flow~ 🌊",
    "Don't worry, I won't sting!",
    "Feeling luminous today! ✨",
    "I've been drifting all day...",
  ],
  seastar: [
    "Hey! Star-struck to see you! ⭐",
    "I'm taking it slow today...",
    "Five arms, five high-fives!",
  ],
  seahorse: [
    "Galloping through the sea! 🌊",
    "Hold my tail, let's explore!",
    "I'm the knight of the ocean! 🏰",
  ],
  crab: [
    "Feeling a bit crabby? Me too! 🦀",
    "Sideways is the only way!",
    "Check out my shell polish!",
  ],
};

// ── Creature class ─────────────────────────
class Creature {
  constructor(type, x, y, size, color, tailColor) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.tailColor = tailColor || color;
    this.vx = rand(-0.5, 0.5);
    this.vy = rand(-0.3, 0.3);
    this.targetVx = this.vx;
    this.targetVy = this.vy;
    this.dir = this.vx >= 0 ? 1 : -1;
    this.wiggle = rand(0, Math.PI * 2);
    this.swimPhase = rand(0, Math.PI * 2);
    this.swimSpeed = rand(0.8, 1.25);
    this.turnTimer = randI(120, 400);
    this.socialCooldown = 0;
    this.name = this.makeName();
  }

  makeName() {
    const names = ['Bubbles','Coral','Finn','Splash','Pepper','Sunny','Pearl','Ziggy','Nemo','Dory','Gill','Squid','Sandy','Neptune','Posie','Marlin','Wave','Shelly','Inky','Jet'];
    return names[randI(0, names.length)];
  }

  update() {
    this.wiggle += 0.08 * this.swimSpeed;
    this.turnTimer--;
    if (this.socialCooldown > 0) this.socialCooldown--;

    const isBottomDweller = this.type === 'lobster' || this.type === 'crab' || this.type === 'downCrab' || this.type === 'upCrab';

    if (this.turnTimer <= 0) {
      this.targetVx = rand(-0.6, 0.6);
      this.targetVy = rand(-0.3, 0.3);
      this.turnTimer = randI(120, 400);
    }

    this.vx += (this.targetVx - this.vx) * (isBottomDweller ? 0.08 : 0.03);
    this.vy += (this.targetVy - this.vy) * (isBottomDweller ? 0.06 : 0.03);

    // Bottom-dwelling types
    if (isBottomDweller) {
      this.vy = 0;
      this.y = renderCanvas.height - 18;
      if (this.turnTimer <= 0) {
        this.targetVx = (Math.random() < 0.5 ? -1 : 1) * rand(0.1, 0.4);
      }
    }
    if (this.type === 'seastar') {
      this.vy = 0;
      this.y = renderCanvas.height - 46;
      if (this.turnTimer <= 0) {
        this.targetVx = (Math.random() < 0.5 ? -1 : 1) * rand(0.05, 0.15);
      }
    }
    if (this.type === 'jellyfish') {
      this.vy = Math.sin(time * 0.015 + this.wiggle) * 0.3;
    } else if (!isBottomDweller && this.type !== 'seastar') {
      this.vy += Math.sin(time * 0.03 + this.swimPhase) * 0.004 * this.swimSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Bounds
    const margin = 30;
    const floorMargin = 8;
    if (this.type === 'downCrab' || this.type === 'upCrab' || this.type === 'crab' || this.type === 'lobster' || this.type === 'seastar') {
      if (this.x < floorMargin)                        { this.x = floorMargin; this.vx *= -1; this.targetVx = Math.abs(this.targetVx); }
      if (this.x > renderCanvas.width - floorMargin)   { this.x = renderCanvas.width - floorMargin; this.vx *= -1; this.targetVx = -Math.abs(this.targetVx); }
    } else {
      if (this.x < margin)                             { this.x = margin; this.vx *= -1; this.targetVx = Math.abs(this.targetVx); }
      if (this.x > renderCanvas.width - margin)        { this.x = renderCanvas.width - margin; this.vx *= -1; this.targetVx = -Math.abs(this.targetVx); }
      if (this.y < margin)                             { this.y = margin; this.vy *= -1; this.targetVy = Math.abs(this.targetVy); }
      if (this.y > renderCanvas.height - 60)           { this.y = renderCanvas.height - 60; this.vy *= -1; this.targetVy = -Math.abs(this.targetVy); }
    }

    if (this.vx !== 0) this.dir = this.vx > 0 ? 1 : -1;
  }

  draw() {
    const isCrabType = this.type === 'downCrab' || this.type === 'upCrab' || this.type === 'crab';
    const isLobsterType = this.type === 'lobster';
    const isBottomDweller = isCrabType || this.type === 'lobster' || this.type === 'seastar';
    const animatedType = isCrabType && Math.floor(time / 20) % 2 === 0 ? 'downCrab' : 'upCrab';
    const lobsterMoving = Math.abs(this.vx) > 0.03;
    const lobsterType = isLobsterType && lobsterMoving && Math.floor(time / 8) % 2 === 0 ? 'lobster_left' : 'lobster_right';
    const img = isCrabType ? images[animatedType] : isLobsterType ? images[lobsterType] : images[this.type];
    if (img && img.complete && img.naturalWidth > 0) {
      // Draw sprite image
      ctx.save();
      const lobsterBob = Math.sin(this.wiggle * 1.25 + this.swimPhase) * 0.7;
      const bobY = isBottomDweller ? (isLobsterType ? lobsterBob : 0) : Math.sin(this.wiggle * this.swimSpeed + this.swimPhase) * 1.4;
      const swimTilt = isBottomDweller
        ? (isLobsterType ? Math.sin(this.wiggle * 1.1 + this.swimPhase) * 0.05 : 0)
        : Math.atan2(this.vy, Math.abs(this.vx) + 0.05) * 0.24 + Math.sin(this.wiggle * 0.55 + this.swimPhase) * 0.08;
      const squirm = isBottomDweller
        ? (isLobsterType ? Math.sin(this.wiggle * 1.8 + this.swimPhase) * 0.02 : 0)
        : Math.sin(this.wiggle * 1.7 + this.swimPhase) * 0.04;

      ctx.translate(this.x, this.y + bobY);
      ctx.rotate(swimTilt);
      ctx.scale(this.dir * (1 + squirm), 1 - squirm * 0.6);
      const aspect = img.width / img.height;
      const spriteScale = getSpriteScale(this.type);
      const width = this.size * spriteScale;
      const height = width / aspect;
      ctx.drawImage(img, -width / 2, -height / 2, width, height);
      ctx.restore();
    } else {
      // Fallback to canvas drawing
      switch (this.type) {
        case 'fish':
          drawFish(this.x, this.y, this.size, this.color, this.tailColor, this.dir, this.wiggle);
          break;
        case 'lobster':
          drawLobster(this.x, this.y, this.size, this.dir, this.wiggle);
          break;
        case 'octopus':
          drawOctopus(this.x, this.y, this.size, this.color, this.wiggle);
          break;
        case 'jellyfish':
          drawJellyfish(this.x, this.y, this.size, this.color, this.wiggle);
          break;
        case 'seastar':
          drawSeaStar(this.x, this.y, this.size, this.color, this.wiggle);
          break;
        case 'seahorse':
          drawSeahorse(this.x, this.y, this.size, this.color, this.dir, this.wiggle);
          break;
        case 'crab':
          drawCrab(this.x, this.y, this.size, this.wiggle);
          break;
        default:
          // Unknown types with no image: draw a simple circle
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
          break;
      }
    }

  }


  greet() {
    const pool = greetings[this.type] || greetings.fish;
    return `${this.name}: "${pool[randI(0, pool.length)]}"`;
  }

}

function getSpriteScale(type) {
  return type === 'dorry' ? 1.25 : type === 'seastar' ? 1.55 : type === 'Whaleshark' ? 1.2 : type === 'lobster' ? 2.35 : (type === 'downCrab' || type === 'upCrab' || type === 'crab') ? 1.9 : 1;
}

function drawReadableNametags() {
  const scaleX = canvas.width / renderCanvas.width;
  const scaleY = canvas.height / renderCanvas.height;

  displayCtx.save();
  displayCtx.textAlign = 'center';
  displayCtx.font = '700 18px Fredoka';
  displayCtx.lineWidth = 4;
  displayCtx.strokeStyle = 'rgba(0, 20, 40, 0.85)';
  displayCtx.fillStyle = 'rgba(255,255,255,0.98)';

  creatures.forEach(c => {
    const spriteScale = getSpriteScale(c.type);
    const labelX = c.x * scaleX;
    const labelY = (c.y - (c.size * spriteScale * 0.5) - 6) * scaleY;
    displayCtx.strokeText(c.name, labelX, labelY);
    displayCtx.fillText(c.name, labelX, labelY);
  });

  const playerLabelX = player.x * scaleX;
  const playerLabelY = (player.y - player.size - 1.5) * scaleY;
  displayCtx.font = '700 20px Fredoka';
  displayCtx.lineWidth = 4.5;
  displayCtx.strokeStyle = 'rgba(0, 20, 40, 0.9)';
  displayCtx.fillStyle = '#f1c40f';
  displayCtx.strokeText('⭐ You', playerLabelX, playerLabelY);
  displayCtx.fillText('⭐ You', playerLabelX, playerLabelY);

  displayCtx.restore();
}
// ── Player (user fish) ─────────────────────
const player = {
  x: 160,
  y: 100,
  size: 30,
  color: '#f1c40f',
  tailColor: '#e67e22',
  vx: 0,
  vy: 0,
  dir: 1,
  wiggle: 0,
  speed: 3,
  name: 'You',
};

// ── Input handling ─────────────────────────
const keys = {};
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup',   e => { keys[e.key.toLowerCase()] = false; });

function handleInput() {
  let ax = 0, ay = 0;
  if (keys['arrowleft']  || keys['a']) ax -= 1;
  if (keys['arrowright'] || keys['d']) ax += 1;
  if (keys['arrowup']    || keys['w']) ay -= 1;
  if (keys['arrowdown']  || keys['s']) ay += 1;

  player.vx += ax * 0.2;
  player.vy += ay * 0.2;

  // Friction
  player.vx *= 0.9;
  player.vy *= 0.9;

  player.x += player.vx;
  player.y += player.vy;

  // Bounds
  player.x = Math.max(10, Math.min(renderCanvas.width - 10, player.x));
  player.y = Math.max(10, Math.min(renderCanvas.height - 20, player.y));

  if (Math.abs(player.vx) > 0.2) player.dir = player.vx > 0 ? 1 : -1;
  player.wiggle += 0.12;

  // Bubble trail
  if (Math.random() < 0.15 && (Math.abs(player.vx) > 0.5 || Math.abs(player.vy) > 0.5)) {
    spawnBubble(player.x - player.dir * player.size, player.y + rand(-5, 5));
  }
}

// ── Chat bubble management ─────────────────
let chatTimeout = null;
function showChat(text, cx, cy) {
  chatBubble.textContent = text;
  chatBubble.classList.add('show');

  const rect = canvas.getBoundingClientRect();
  chatBubble.style.left = `${rect.left + cx - 100}px`;
  chatBubble.style.top  = `${rect.top + cy - 50}px`;

  clearTimeout(chatTimeout);
  chatTimeout = setTimeout(() => chatBubble.classList.remove('show'), 3000);
}

// ── Player type selection ──────────────────
let playerType = 'dorry';

function getSpawnSize(type) {
  switch (type) {
    case 'dorry':
    case 'clownfish':
      return rand(22, 28);
    case 'axilottle':
      return rand(24, 32);
    case 'seahorse':
      return rand(20, 26);
    case 'seastar':
      return rand(16, 22);
    case 'Whaleshark':
    case 'seaturtle':
      return rand(40, 50);
    case 'downCrab':
    case 'upCrab':
    case 'crab':
    case 'lobster':
      return rand(20, 28);
    default:
      return rand(12, 20);
  }
}

// ── Drag & Drop Creature Picker ────────────
const availableCreatures = [
  { type: 'dorry', label: 'Dory', colors: ['#3498db'], sprite: 'dorry' },
  { type: 'clownfish', label: 'Clownfish', colors: ['#e74c3c'], sprite: 'clownfish' },
  { type: 'axilottle', label: 'Axolotl', colors: ['#c0392b'], sprite: 'axilottle' },
  { type: 'seahorse', label: 'Seahorse', colors: ['#f1c40f'], sprite: 'seahorse' },
  { type: 'seastar', label: 'Sea Star', colors: ['#f39c12', '#e74c3c'], sprite: 'seastar' },
  { type: 'downCrab', label: 'Crab', colors: ['#c0392b', '#e67e22'], sprite: 'downCrab' },
  { type: 'lobster', label: 'Lobster', colors: ['#c0392b', '#e67e22'], sprite: 'lobster_right' },
  { type: 'Whaleshark', label: 'Whale Shark', colors: ['#5a8fa8'], sprite: 'Whaleshark' },
  { type: 'seaturtle', label: 'Sea Turtle', colors: ['#2ecc71', '#27ae60'], sprite: 'seaturtle' },
];

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  availableCreatures.forEach(creature => {
    const picker = document.createElement('div');
    picker.className = 'creature-picker';
    picker.draggable = true;
    picker.dataset.type = creature.type;
    const spriteImg = images[creature.sprite] || images[creature.type];
    const spriteSrc = spriteImg ? spriteImg.src : '';
    picker.innerHTML = `<div class="creature-picker-icon"><img src="${spriteSrc}" alt="${creature.label}" draggable="false" /></div><div class="creature-picker-label">${creature.label}</div>`;
    const pickerImg = picker.querySelector('.creature-picker-icon img');

    if (creature.type === 'dorry' && pickerImg) {
      pickerImg.classList.add('creature-picker-icon-dorry');
    }

    if (creature.type === 'downCrab') {
      const crabIcon = picker.querySelector('.creature-picker-icon img');
      let crabUpFrame = false;
      setInterval(() => {
        const nextFrame = images[crabUpFrame ? 'downCrab' : 'upCrab'];
        if (nextFrame && crabIcon) crabIcon.src = nextFrame.src;
        crabUpFrame = !crabUpFrame;
      }, 1000);
    }

    if (creature.type === 'lobster') {
      const lobsterIcon = picker.querySelector('.creature-picker-icon img');
      let lobsterFrameRight = true;
      setInterval(() => {
        const nextFrame = images[lobsterFrameRight ? 'lobster_right' : 'lobster_left'];
        if (nextFrame && lobsterIcon) lobsterIcon.src = nextFrame.src;
        lobsterFrameRight = !lobsterFrameRight;
      }, 900);
    }
    
    // Mark the default player type as selected
    if (creature.type === playerType) {
      picker.classList.add('selected-player');
    }

    // Click to select as player fish
    picker.addEventListener('click', (e) => {
      // Don't select if this was a drag
      if (picker._wasDragged) { picker._wasDragged = false; return; }
      playerType = creature.type;
      // Update visual selection
      sidebar.querySelectorAll('.creature-picker').forEach(p => p.classList.remove('selected-player'));
      picker.classList.add('selected-player');
    });

    picker.addEventListener('dragstart', (e) => {
      picker._wasDragged = true;
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('creatureType', creature.type);
    });
    
    sidebar.appendChild(picker);
  });
}

// Canvas drag-drop handlers
canvas.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  canvas.style.filter = 'brightness(1.2)';
});

canvas.addEventListener('dragleave', () => {
  canvas.style.filter = 'brightness(1)';
});

canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  canvas.style.filter = 'brightness(1)';
  
  const creatureType = e.dataTransfer.getData('creatureType');
  if (!creatureType) return;
  
  // Get drop position relative to canvas
  const rect = canvas.getBoundingClientRect();
  const dropX = (e.clientX - rect.left) / (rect.width / renderCanvas.width);
  const dropY = (e.clientY - rect.top) / (rect.height / renderCanvas.height);
  
  // Clamp to valid range
  const x = Math.max(20, Math.min(renderCanvas.width - 20, dropX));
  const y = Math.max(20, Math.min(renderCanvas.height - 60, dropY));
  
  // Add creature based on type
  const creatureDef = availableCreatures.find(c => c.type === creatureType);
  if (creatureDef) {
    const size = getSpawnSize(creatureType);
    const color = creatureDef.colors[randI(0, creatureDef.colors.length)];
    let y_pos = y;
    if (creatureType === 'downCrab' || creatureType === 'upCrab' || creatureType === 'crab' || creatureType === 'lobster') {
      y_pos = renderCanvas.height - 18;
    } else if (creatureType === 'seastar') {
      y_pos = renderCanvas.height - 46;
    }
    creatures.push(new Creature(creatureType, x, y_pos, size, color));
  }
});

initSidebar();

// ── Drag Creatures to Trash ────────────────
let draggedCreature = null;
let draggedCreatureIndex = -1;
const trashBin = document.getElementById('trashBin');

// Detect creature drag from canvas
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = (e.clientX - rect.left) / (rect.width / renderCanvas.width);
  const clickY = (e.clientY - rect.top) / (rect.height / renderCanvas.height);
  
  // Check if click hits any creature
  for (let i = creatures.length - 1; i >= 0; i--) {
    const c = creatures[i];
    const distance = Math.hypot(clickX - c.x, clickY - c.y);
    if (distance < c.size + 8) {
      draggedCreature = c;
      draggedCreatureIndex = i;
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
      break;
    }
  }
});

document.addEventListener('mousemove', (e) => {
  if (!draggedCreature) return;
  
  // Check if over trash bin
  const trashRect = trashBin.getBoundingClientRect();
  const isOverTrash = e.clientX >= trashRect.left && 
                      e.clientX <= trashRect.right &&
                      e.clientY >= trashRect.top && 
                      e.clientY <= trashRect.bottom;
  
  if (isOverTrash) {
    trashBin.classList.add('drag-over');
  } else {
    trashBin.classList.remove('drag-over');
  }
});

document.addEventListener('mouseup', (e) => {
  if (!draggedCreature) return;
  
  // Check if dropped on trash
  const trashRect = trashBin.getBoundingClientRect();
  const isOverTrash = e.clientX >= trashRect.left && 
                      e.clientX <= trashRect.right &&
                      e.clientY >= trashRect.top && 
                      e.clientY <= trashRect.bottom;
  
  if (isOverTrash && draggedCreatureIndex !== -1) {
    // Spawn deletion particles
    for (let j = 0; j < 8; j++) {
      spawnBubble(draggedCreature.x + rand(-8, 8), draggedCreature.y + rand(-8, 8));
    }
    creatures.splice(draggedCreatureIndex, 1);
  }
  
  // Clean up
  draggedCreature = null;
  draggedCreatureIndex = -1;
  canvas.style.cursor = 'default';
  trashBin.classList.remove('drag-over');
});

// ── Spawn creatures ────────────────────────
const creatures = [];

// Fish (Dory - default)
for (let i = 0; i < 6; i++) {
  creatures.push(new Creature('dorry', rand(20, 300), rand(20, 130), getSpawnSize('dorry'), '#3498db'));
}

// Axolotl swimmers
for (let i = 0; i < 2; i++) {
  creatures.push(new Creature('axilottle', rand(40, 280), rand(40, 120), getSpawnSize('axilottle'), '#c0392b'));
}

// Clownfish
creatures.push(new Creature('clownfish', rand(40, 280), rand(40, 120), getSpawnSize('clownfish'), '#e74c3c'));
creatures.push(new Creature('clownfish', rand(40, 280), rand(40, 120), getSpawnSize('clownfish'), '#f39c12'));

// Whaleshark (biggest creature)
creatures.push(new Creature('Whaleshark', rand(40, 240), rand(30, 90), getSpawnSize('Whaleshark'), '#5a8fa8'));

// Crabs & lobsters – on the seafloor
creatures.push(new Creature('downCrab', rand(30, 290), renderCanvas.height - 18, getSpawnSize('downCrab'), '#c0392b'));
creatures.push(new Creature('upCrab', rand(30, 290), renderCanvas.height - 18, getSpawnSize('upCrab'), '#e67e22'));
creatures.push(new Creature('downCrab', rand(30, 290), renderCanvas.height - 18, getSpawnSize('downCrab'), '#d35400'));
creatures.push(new Creature('lobster', rand(30, 290), renderCanvas.height - 18, getSpawnSize('lobster'), '#c0392b'));
creatures.push(new Creature('lobster', rand(30, 290), renderCanvas.height - 18, getSpawnSize('lobster'), '#e67e22'));

// Seahorse
creatures.push(new Creature('seahorse', rand(40, 280), rand(40, 120), getSpawnSize('seahorse'), '#f1c40f'));

// Sea stars – bottom
creatures.push(new Creature('seastar', rand(20, 300), renderCanvas.height - 46, getSpawnSize('seastar'), '#f39c12'));
creatures.push(new Creature('seastar', rand(20, 300), renderCanvas.height - 46, getSpawnSize('seastar'), '#e74c3c'));

// ── Socialise check ────────────────────────
let socialCooldownGlobal = 0;

function checkSocialise() {
  if (socialCooldownGlobal > 0) { socialCooldownGlobal--; return; }
  for (const c of creatures) {
    if (c.socialCooldown > 0) continue;
    const d = dist(player, c);
    if (d < 55) {
      showChat(c.greet(), c.x, c.y);
      c.socialCooldown = 300; // ~5 sec at 60fps
      socialCooldownGlobal = 90;
      // spawn happy bubbles
      for (let i = 0; i < 4; i++) spawnBubble(c.x + rand(-10, 10), c.y - 10);
      break;
    }
  }
}

// ── Heart particle effect on socialise ─────
const hearts = [];
function spawnHeart(x, y) {
  hearts.push({ x, y, vy: -1, alpha: 1, size: rand(8, 14) });
}
function updateHearts() {
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i];
    h.y += h.vy;
    h.alpha -= 0.015;
    if (h.alpha <= 0) hearts.splice(i, 1);
  }
}
function drawHearts() {
  hearts.forEach(h => {
    ctx.save();
    ctx.globalAlpha = h.alpha;
    ctx.font = `${h.size}px Fredoka`;
    ctx.fillText('💙', h.x, h.y);
    ctx.restore();
  });
}

// Override showChat to also spawn hearts
const _showChat = showChat;
showChat = function(text, cx, cy) {
  _showChat(text, cx, cy);
  for (let i = 0; i < 3; i++) spawnHeart(cx + rand(-15, 15), cy - 20);
};

// ── Fish Food Particles ────────────────────
const foodParticles = [];
let feedingActive = false;

function spawnFishFood() {
  feedingActive = true;
  const numPellets = 25;
  for (let i = 0; i < numPellets; i++) {
    foodParticles.push({
      x: rand(20, renderCanvas.width - 20),
      y: rand(-20, -5),
      vy: rand(0.15, 0.4),
      vx: rand(-0.1, 0.1),
      size: rand(2, 4),
      color: ['#ff8c00', '#ff6f00', '#e65100', '#f57c00', '#ff9800'][randI(0, 5)],
      alpha: 1,
      settled: false,
      settleY: renderCanvas.height - rand(48, 56),
      delay: i * 3, // stagger the drops
    });
  }
}

function updateFoodParticles() {
  for (let i = foodParticles.length - 1; i >= 0; i--) {
    const f = foodParticles[i];
    if (f.delay > 0) { f.delay--; continue; }
    if (!f.settled) {
      f.y += f.vy;
      f.x += f.vx;
      f.vx += rand(-0.01, 0.01); // gentle drift
      // Creatures "eat" nearby food
      let eaten = false;
      for (const c of creatures) {
        if (dist({ x: f.x, y: f.y }, c) < c.size * 0.6) {
          eaten = true;
          // Spawn a tiny heart when creature eats
          spawnHeart(c.x + rand(-5, 5), c.y - 10);
          break;
        }
      }
      if (eaten) {
        foodParticles.splice(i, 1);
        continue;
      }
      if (f.y >= f.settleY) {
        f.y = f.settleY;
        f.settled = true;
      }
    } else {
      f.alpha -= 0.003;
      if (f.alpha <= 0) {
        foodParticles.splice(i, 1);
      }
    }
  }
  if (feedingActive && foodParticles.length === 0) {
    feedingActive = false;
  }
}

function drawFoodParticles() {
  foodParticles.forEach(f => {
    if (f.delay > 0) return;
    ctx.save();
    ctx.globalAlpha = f.alpha;
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    ctx.fill();
    // small highlight
    ctx.fillStyle = 'rgba(255,255,200,0.5)';
    ctx.beginPath();
    ctx.arc(f.x - f.size * 0.3, f.y - f.size * 0.3, f.size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// ── Study Timer ────────────────────────────
const timerDisplay = document.getElementById('timerDisplay');
const timerMinInput = document.getElementById('timerMin');
const timerSecInput = document.getElementById('timerSec');
const timerStartBtn = document.getElementById('timerStart');
const timerPauseBtn = document.getElementById('timerPause');
const timerResetBtn = document.getElementById('timerReset');
const timerStatus = document.getElementById('timerStatus');
const feedMessage = document.getElementById('feedMessage');
const todoInput = document.getElementById('todoInput');
const todoAddBtn = document.getElementById('todoAddBtn');
const todoList = document.getElementById('todoList');

let timerInterval = null;
let timerRemaining = 25 * 60; // seconds
let timerRunning = false;
let timerOriginal = 25 * 60;

function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timerRemaining);
}

function startTimer() {
  if (timerRunning) return;
  const mins = parseInt(timerMinInput.value) || 0;
  const secs = parseInt(timerSecInput.value) || 0;
  if (!timerInterval) {
    // Fresh start — read from inputs
    timerRemaining = mins * 60 + secs;
    timerOriginal = timerRemaining;
  }
  if (timerRemaining <= 0) {
    timerStatus.textContent = 'Set a time first!';
    return;
  }
  timerRunning = true;
  timerStartBtn.style.display = 'none';
  timerPauseBtn.style.display = 'block';
  timerMinInput.disabled = true;
  timerSecInput.disabled = true;
  timerStatus.textContent = '📖 Studying...';
  feedMessage.textContent = '';

  timerInterval = setInterval(() => {
    timerRemaining--;
    updateTimerDisplay();
    if (timerRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerRunning = false;
      timerStartBtn.style.display = 'block';
      timerPauseBtn.style.display = 'none';
      timerMinInput.disabled = false;
      timerSecInput.disabled = false;
      timerStatus.textContent = '✅ Time\'s up!';
      feedMessage.textContent = '🐟 Feeding time! 🐟';
      // Reset inputs to original
      timerMinInput.value = String(Math.floor(timerOriginal / 60)).padStart(2, '0');
      timerSecInput.value = String(timerOriginal % 60).padStart(2, '0');
      // Feed the fish!
      spawnFishFood();
      // Clear feed message after a few seconds
      setTimeout(() => { feedMessage.textContent = ''; }, 5000);
    }
  }, 1000);
}

function pauseTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  timerStartBtn.style.display = 'block';
  timerStartBtn.textContent = '▶ Resume';
  timerPauseBtn.style.display = 'none';
  timerStatus.textContent = '⏸ Paused';
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning = false;
  const mins = parseInt(timerMinInput.value) || 25;
  const secs = parseInt(timerSecInput.value) || 0;
  timerRemaining = mins * 60 + secs;
  timerOriginal = timerRemaining;
  updateTimerDisplay();
  timerStartBtn.style.display = 'block';
  timerStartBtn.textContent = '▶ Start';
  timerPauseBtn.style.display = 'none';
  timerMinInput.disabled = false;
  timerSecInput.disabled = false;
  timerStatus.textContent = 'Set your study time';
  feedMessage.textContent = '';
}

timerStartBtn.addEventListener('click', startTimer);
timerPauseBtn.addEventListener('click', pauseTimer);
timerResetBtn.addEventListener('click', resetTimer);

// Update display when inputs change
timerMinInput.addEventListener('input', () => {
  if (!timerRunning) {
    const mins = parseInt(timerMinInput.value) || 0;
    const secs = parseInt(timerSecInput.value) || 0;
    timerRemaining = mins * 60 + secs;
    updateTimerDisplay();
  }
});
timerSecInput.addEventListener('input', () => {
  if (!timerRunning) {
    const mins = parseInt(timerMinInput.value) || 0;
    const secs = parseInt(timerSecInput.value) || 0;
    timerRemaining = mins * 60 + secs;
    updateTimerDisplay();
  }
});

// ── To-Do List ────────────────────────────
function createTodoItem(text) {
  const item = document.createElement('li');
  item.className = 'todo-item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'todo-check';

  const label = document.createElement('span');
  label.className = 'todo-text';
  label.textContent = text;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'todo-remove';
  removeBtn.type = 'button';
  removeBtn.textContent = '✕';
  removeBtn.setAttribute('aria-label', 'Remove task');

  checkbox.addEventListener('change', () => {
    item.classList.toggle('done', checkbox.checked);
    if (checkbox.checked) {
      feedMessage.textContent = '🐟 Task complete! Feeding time! 🐟';
      spawnFishFood();
      setTimeout(() => {
        if (feedMessage.textContent === '🐟 Task complete! Feeding time! 🐟') {
          feedMessage.textContent = '';
        }
      }, 4000);
    }
  });

  removeBtn.addEventListener('click', () => {
    item.remove();
  });

  item.appendChild(checkbox);
  item.appendChild(label);
  item.appendChild(removeBtn);
  todoList.prepend(item);
}

function addTodoFromInput() {
  const text = todoInput.value.trim();
  if (!text) return;
  createTodoItem(text);
  todoInput.value = '';
  todoInput.focus();
}

todoAddBtn.addEventListener('click', addTodoFromInput);
todoInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addTodoFromInput();
  }
});

// ── Main game loop ─────────────────────────
function gameLoop() {
  if (!gameStarted) return;
  time++;
  handleInput();

  // Update
  creatures.forEach(c => c.update());
  updateBubbles();
  updateHearts();
  updateFoodParticles();
  checkSocialise();

  // Draw
  drawBackground();
  drawCoral();
  drawBubbles();
  drawFoodParticles();
  creatures.forEach(c => c.draw());

  // Draw player
  const playerImg = images[playerType];
  if (playerImg && playerImg.complete && playerImg.naturalWidth > 0) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.scale(player.dir, 1);
    const aspect = playerImg.width / playerImg.height;
    const w = player.size;
    const h = w / aspect;
    ctx.drawImage(playerImg, -w / 2, -h / 2, w, h);
    ctx.restore();
  } else {
    drawFish(player.x, player.y, player.size, player.color, player.tailColor, player.dir, player.wiggle);
  }

  drawHearts();

  // Vignette
  const vg = ctx.createRadialGradient(renderCanvas.width / 2, renderCanvas.height / 2, renderCanvas.width * 0.3, renderCanvas.width / 2, renderCanvas.height / 2, renderCanvas.width * 0.7);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,10,30,0.35)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);

  // Scale low-res canvas to screen
displayCtx.clearRect(0, 0, canvas.width, canvas.height);
displayCtx.drawImage(
  renderCanvas,
  0, 0,
  canvas.width,
  canvas.height
);
drawReadableNametags();

  requestAnimationFrame(gameLoop);
}

function popStartBubbles(originX, originY) {
  const burstCount = 14;
  for (let i = 0; i < burstCount; i++) {
    const bubble = document.createElement('span');
    bubble.className = 'start-pop-bubble';
    const angle = (Math.PI * 2 * i) / burstCount + rand(-0.18, 0.18);
    const radius = rand(34, 74);
    const dx = Math.cos(angle) * radius;
    const dy = Math.sin(angle) * radius - rand(6, 16);
    const size = rand(7, 15);
    bubble.style.left = `${originX - size / 2}px`;
    bubble.style.top = `${originY - size / 2}px`;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.setProperty('--dx', `${dx}px`);
    bubble.style.setProperty('--dy', `${dy}px`);
    startScreen.appendChild(bubble);
    setTimeout(() => bubble.remove(), 430);
  }
}

diveInBtn.addEventListener('click', (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  popStartBubbles(originX, originY);

  gameStarted = true;
  setTimeout(() => {
    startScreen.classList.add('hidden');
    if (!gameLoopStarted) {
      gameLoopStarted = true;
      gameLoop();
    }
  }, 180);
});
