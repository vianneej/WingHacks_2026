// ============================================
//  Aquarium Adventure – main.js
// ============================================

const canvas = document.getElementById('game');
const displayCtx = canvas.getContext('2d');
const chatBubble = document.getElementById('chatBubble');

canvas.width = 960;
canvas.height = 600;

const renderCanvas = document.createElement('canvas');
renderCanvas.width = 320;
renderCanvas.height = 200;

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
loadImage("Whaleshark", 'assets/whaleshark.png');
loadImage("dorry", 'assets/dorry.png');

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

// ── Coral reef structures (static, realistic) ──────
function drawCoral() {
  const floorY = renderCanvas.height - 46;

  // --- Brain coral (round bumpy dome) ---
  function drawBrainCoral(cx, cy, r, hue) {
    // Base dome
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.7, 0, Math.PI, 0);
    ctx.fillStyle = `hsl(${hue}, 50%, 55%)`;
    ctx.fill();
    ctx.strokeStyle = `hsl(${hue}, 40%, 40%)`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Squiggly ridges
    ctx.strokeStyle = `hsl(${hue}, 35%, 42%)`;
    ctx.lineWidth = 0.6;
    for (let i = -r * 0.6; i < r * 0.6; i += 3) {
      ctx.beginPath();
      ctx.moveTo(cx + i, cy - r * 0.15);
      ctx.quadraticCurveTo(cx + i + 1.5, cy - r * 0.4, cx + i + 3, cy - r * 0.15);
      ctx.stroke();
    }
  }

  // --- Fan coral (flat branching fan) ---
  function drawFanCoral(cx, cy, w, h, hue) {
    // Stem
    ctx.strokeStyle = `hsl(${hue}, 40%, 35%)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - h * 0.3);
    ctx.stroke();
    // Fan shape
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.5, cy - h * 0.25);
    ctx.quadraticCurveTo(cx - w * 0.55, cy - h, cx, cy - h);
    ctx.quadraticCurveTo(cx + w * 0.55, cy - h, cx + w * 0.5, cy - h * 0.25);
    ctx.closePath();
    ctx.fillStyle = `hsl(${hue}, 60%, 50%)`;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = `hsl(${hue}, 50%, 40%)`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Veins
    ctx.strokeStyle = `hsl(${hue}, 45%, 42%)`;
    ctx.lineWidth = 0.4;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - h * 0.3);
      ctx.quadraticCurveTo(cx + i * w * 0.1, cy - h * 0.7, cx + i * w * 0.15, cy - h * 0.95);
      ctx.stroke();
    }
  }

  // --- Tube / finger coral ---
  function drawTubeCoral(cx, cy, tubes, h, hue) {
    for (let i = 0; i < tubes; i++) {
      const tx = cx + (i - (tubes - 1) / 2) * 4;
      const th = h * (0.6 + (i % 3) * 0.2);
      ctx.fillStyle = `hsl(${hue + i * 5}, 55%, 52%)`;
      ctx.beginPath();
      ctx.moveTo(tx - 2, cy);
      ctx.lineTo(tx - 1.8, cy - th);
      ctx.arc(tx, cy - th, 2, Math.PI, 0);
      ctx.lineTo(tx + 2, cy);
      ctx.closePath();
      ctx.fill();
      // Rim
      ctx.beginPath();
      ctx.arc(tx, cy - th, 2, Math.PI, 0);
      ctx.strokeStyle = `hsl(${hue + i * 5}, 50%, 60%)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  // --- Staghorn coral (branching Y shapes) ---
  function drawStaghorn(cx, cy, size, hue) {
    ctx.strokeStyle = `hsl(${hue}, 50%, 48%)`;
    ctx.lineCap = 'round';
    // Main trunk
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - size * 0.5);
    ctx.stroke();
    // Branches
    const branches = [
      [cx, cy - size * 0.5, cx - size * 0.3, cy - size * 0.9],
      [cx, cy - size * 0.5, cx + size * 0.35, cy - size * 0.85],
      [cx - size * 0.3, cy - size * 0.9, cx - size * 0.5, cy - size],
      [cx - size * 0.3, cy - size * 0.9, cx - size * 0.15, cy - size * 1.05],
      [cx + size * 0.35, cy - size * 0.85, cx + size * 0.25, cy - size * 1.05],
      [cx + size * 0.35, cy - size * 0.85, cx + size * 0.5, cy - size * 0.95],
    ];
    ctx.lineWidth = 1.2;
    branches.forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
    // Tips
    ctx.fillStyle = `hsl(${hue}, 55%, 58%)`;
    branches.slice(2).forEach(([,,tx, ty]) => {
      ctx.beginPath();
      ctx.arc(tx, ty, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Place corals along the floor (all static, no movement)
  drawBrainCoral(45, floorY, 12, 350);
  drawBrainCoral(250, floorY, 9, 20);
  drawFanCoral(100, floorY, 20, 28, 320);
  drawFanCoral(280, floorY, 16, 22, 300);
  drawTubeCoral(155, floorY, 5, 20, 30);
  drawTubeCoral(210, floorY, 4, 16, 45);
  drawStaghorn(75, floorY, 18, 10);
  drawStaghorn(185, floorY, 14, 355);
  drawStaghorn(300, floorY, 16, 340);
}

// ── Background – sand, water, plants ───────
const plants = Array.from({ length: 12 }, () => ({
  x: rand(30, 310),
  h: rand(15, 45),
  w: rand(2, 5),
  hue: randI(100, 160),
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

for (let i = 0; i < colors.length; i++) {
  ctx.fillStyle = colors[i];
  ctx.fillRect(
    0,
    i * bandHeight,
    renderCanvas.width,
    bandHeight
  );
}

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

  // Seaweed / plants
  plants.forEach(p => {
  if (p.x > renderCanvas.width) return;

  const baseY = renderCanvas.height - 46;
  const sway = Math.floor(Math.sin(time * 0.02 + p.phase) * 3);

  ctx.fillStyle = `hsl(${p.hue}, 50%, 50%)`;

  // Main stalk (blocky)
  for (let y = 0; y < p.h; y += 6) {
    ctx.fillRect(
      p.x + sway,
      baseY - y,
      6,
      6
    );
  }

  // Pixel leaves
  ctx.fillStyle = `hsl(${p.hue}, 55%, 60%)`;

  for (let y = 12; y < p.h; y += 18) {
    ctx.fillRect(p.x + sway - 6, baseY - y, 6, 6);
    ctx.fillRect(p.x + sway + 6, baseY - y - 4, 6, 6);
  }
});

  // Small decorative rocks
  [[80, renderCanvas.height - 44, 18], [300, renderCanvas.height - 42, 12], [700, renderCanvas.height - 43, 15], [880, renderCanvas.height - 44, 10]].forEach(([rx, ry, rr]) => {
    if (rx > renderCanvas.width) return;
    ctx.beginPath();
    ctx.ellipse(rx, ry, rr, rr * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#7a7a6a';
    ctx.fill();
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
    this.dir = this.vx >= 0 ? 1 : -1;
    this.wiggle = rand(0, Math.PI * 2);
    this.turnTimer = randI(120, 400);
    this.socialCooldown = 0;
    this.name = this.makeName();
  }

  makeName() {
    const names = ['Bubbles','Coral','Finn','Splash','Pepper','Sunny','Pearl','Ziggy','Nemo','Dory','Gill','Squid','Sandy','Neptune','Posie','Marlin','Wave','Shelly','Inky','Jet'];
    return names[randI(0, names.length)];
  }

  update() {
    this.wiggle += 0.08;
    this.turnTimer--;
    if (this.socialCooldown > 0) this.socialCooldown--;

    if (this.turnTimer <= 0) {
      this.vx = rand(-0.6, 0.6);
      this.vy = rand(-0.3, 0.3);
      this.turnTimer = randI(120, 400);
    }

    // Bottom-dwelling types
    if (this.type === 'lobster' || this.type === 'crab' || this.type === 'downCrab' || this.type === 'upCrab') {
      this.vy = 0;
      this.y = renderCanvas.height - 18;
      this.vx = Math.sign(this.vx) * 0.15;
    }
    if (this.type === 'seastar') {
      this.vx *= 0.98;
      this.vy = 0;
      this.y = renderCanvas.height - 17;
    }
    if (this.type === 'jellyfish') {
      this.vy = Math.sin(time * 0.015 + this.wiggle) * 0.3;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Bounds
    const margin = 30;
    if (this.x < margin)            { this.x = margin; this.vx *= -1; }
    if (this.x > renderCanvas.width - margin)  { this.x = renderCanvas.width - margin; this.vx *= -1; }
    if (this.y < margin)            { this.y = margin; this.vy *= -1; }
    if (this.y > renderCanvas.height - 60){ this.y = renderCanvas.height - 60; this.vy *= -1; }

    if (this.vx !== 0) this.dir = this.vx > 0 ? 1 : -1;
  }

  draw() {
    const img = images[this.type];
    if (img && img.complete && img.naturalWidth > 0) {
      // Draw sprite image
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(this.dir, 1);
      const aspect = img.width / img.height;
      const width = this.size;
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

    // Name tag
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '4px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, this.x, this.y - this.size * 0.5 - 3);
  }


  greet() {
    const pool = greetings[this.type] || greetings.fish;
    return `${this.name}: "${pool[randI(0, pool.length)]}"`;
  }

}
// ── Player (user fish) ─────────────────────
const player = {
  x: 160,
  y: 100,
  size: 12,
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

// ── Drag & Drop Creature Picker ────────────
const availableCreatures = [
  { type: 'dorry', icon: '🐟', label: 'Dory', colors: ['#3498db'] },
  { type: 'clownfish', icon: '🐠', label: 'Clownfish', colors: ['#e74c3c'] },
  { type: 'axilottle', icon: '🦎', label: 'Axolotl', colors: ['#c0392b'] },
  { type: 'seahorse', icon: '🐴', label: 'Seahorse', colors: ['#f1c40f'] },
  { type: 'seastar', icon: '⭐', label: 'Sea Star', colors: ['#f39c12', '#e74c3c'] },
  { type: 'downCrab', icon: '🦀', label: 'Crab', colors: ['#c0392b', '#e67e22'] },
  { type: 'Whaleshark', icon: '🐋', label: 'Whale Shark', colors: ['#5a8fa8'] },
];

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  availableCreatures.forEach(creature => {
    const picker = document.createElement('div');
    picker.className = 'creature-picker';
    picker.draggable = true;
    picker.dataset.type = creature.type;
    picker.innerHTML = `<div class="creature-picker-icon">${creature.icon}</div><div class="creature-picker-label">${creature.label}</div>`;
    
    picker.addEventListener('dragstart', (e) => {
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
    const size = creatureType === 'Whaleshark' ? rand(40, 50) : creatureType === 'downCrab' || creatureType === 'upCrab' ? rand(22, 28) : rand(12, 20);
    const color = creatureDef.colors[randI(0, creatureDef.colors.length)];
    let y_pos = y;
    if (creatureType === 'downCrab' || creatureType === 'upCrab' || creatureType === 'crab') {
      y_pos = renderCanvas.height - 18;
    } else if (creatureType === 'seastar') {
      y_pos = renderCanvas.height - 17;
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
  creatures.push(new Creature('dorry', rand(20, 300), rand(20, 130), rand(22, 28), '#3498db'));
}

// Axolotl swimmers
for (let i = 0; i < 2; i++) {
  creatures.push(new Creature('axilottle', rand(40, 280), rand(40, 120), rand(24, 32), '#c0392b'));
}

// Clownfish
creatures.push(new Creature('clownfish', rand(40, 280), rand(40, 120), rand(22, 28), '#e74c3c'));
creatures.push(new Creature('clownfish', rand(40, 280), rand(40, 120), rand(22, 28), '#f39c12'));

// Whaleshark (biggest creature)
creatures.push(new Creature('Whaleshark', rand(40, 240), rand(30, 90), rand(40, 50), '#5a8fa8'));

// Crabs – on the seafloor
creatures.push(new Creature('downCrab', rand(30, 290), renderCanvas.height - 18, rand(22, 28), '#c0392b'));
creatures.push(new Creature('upCrab', rand(30, 290), renderCanvas.height - 18, rand(22, 28), '#e67e22'));
creatures.push(new Creature('downCrab', rand(30, 290), renderCanvas.height - 18, rand(20, 24), '#d35400'));

// Seahorse
creatures.push(new Creature('seahorse', rand(40, 280), rand(40, 120), rand(20, 26), '#f1c40f'));

// Sea stars – bottom
creatures.push(new Creature('seastar', rand(20, 300), renderCanvas.height - 17, rand(8, 12), '#f39c12'));
creatures.push(new Creature('seastar', rand(20, 300), renderCanvas.height - 17, rand(7, 10), '#e74c3c'));

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
    ctx.font = `${h.size}px sans-serif`;
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

// ── Main game loop ─────────────────────────
function gameLoop() {
  time++;
  handleInput();

  // Update
  creatures.forEach(c => c.update());
  updateBubbles();
  updateHearts();
  checkSocialise();

  // Draw
  drawBackground();
  drawCoral();
  drawBubbles();
  creatures.forEach(c => c.draw());

  // Draw player
  drawFish(player.x, player.y, player.size, player.color, player.tailColor, player.dir, player.wiggle);
  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 5px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⭐ You', player.x, player.y - player.size - 4);

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

  requestAnimationFrame(gameLoop);
}

gameLoop();
