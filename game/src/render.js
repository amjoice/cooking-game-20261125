// Sizzle & Serve: every pixel the player sees, drawn on one canvas with plain
// 2D shapes — no image files, no fonts from the network. drawItem() draws each
// ingredient so the order board, the stations and the chef's hands all agree.
import { CHOP_SECONDS, FLOOR, GRILL_BURN_AFTER, GRILL_SECONDS, HUD, INGREDIENTS, ITEMS, ORDER_CARD, STATIONS, VIEW } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, carriedItems, shiftSummary } from './world.js';

const WALL = '#8a5a33';
const WALL_TOP = '#a06a3e';
const FLOOR_A = '#f3e2c2';
const FLOOR_B = '#e9d3a8';
const COUNTER_TOP = '#c98d4b';
const COUNTER_SIDE = '#9c6a35';
const INK = '#3a2a18';
const CREAM = '#fff8ea';
const RED = '#e2483d';
const GREEN = '#2e9e4f';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, -apple-system, 'Segoe UI', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** Draw one ingredient or finished item, centred at (x, y), about `size` wide. */
export function drawItem(ctx, kind, x, y, size) {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'bun') {
    ctx.fillStyle = '#e8a95c';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.08, s * 0.48, s * 0.3, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#d18f3f';
    ctx.fillRect(-s * 0.48, -s * 0.08, s * 0.96, s * 0.1);
    ctx.fillStyle = '#f7d9a0';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.06, s * 0.48, s * 0.14, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-0.2, -0.22], [0.05, -0.3], [0.25, -0.18]]) {
      ctx.beginPath();
      ctx.ellipse(dx * s, dy * s, s * 0.05, s * 0.03, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'patty') {
    ctx.fillStyle = '#a05a2c';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.46, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c97e4a';
    ctx.beginPath();
    ctx.ellipse(-s * 0.12, -s * 0.06, s * 0.2, s * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'pattyCooked') {
    ctx.fillStyle = '#6b3d16';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.46, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4a2a0e';
    ctx.lineWidth = s * 0.05;
    for (const dx of [-0.22, 0, 0.22]) {
      ctx.beginPath();
      ctx.moveTo(dx * s, -s * 0.2);
      ctx.lineTo(dx * s, s * 0.2);
      ctx.stroke();
    }
    ctx.fillStyle = '#8a5a2c';
    ctx.beginPath();
    ctx.ellipse(-s * 0.1, -s * 0.08, s * 0.18, s * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'pattyBurnt') {
    ctx.fillStyle = '#241a12';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.46, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath();
    ctx.ellipse(s * 0.12, -s * 0.08, s * 0.12, s * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'tomato' || kind === 'tomatoChopped') {
    ctx.fillStyle = '#e2483d';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f28b82';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd9d0';
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * s * 0.16, Math.sin(a) * s * 0.16, s * 0.07, s * 0.04, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#2e9e4f';
    ctx.fillRect(-s * 0.04, -s * 0.52, s * 0.08, s * 0.16);
  } else if (kind === 'lettuce' || kind === 'lettuceChopped') {
    ctx.fillStyle = '#58b368';
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      ctx.ellipse(Math.cos(a) * s * 0.22, Math.sin(a) * s * 0.22, s * 0.26, s * 0.18, a, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.strokeStyle = '#2e7d3f';
    ctx.lineWidth = s * 0.04;
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, 0);
    ctx.lineTo(s * 0.3, 0);
    ctx.stroke();
  } else if (kind === 'cheese') {
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, s * 0.28);
    ctx.lineTo(s * 0.42, s * 0.28);
    ctx.lineTo(0, -s * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8a91c';
    for (const [dx, dy] of [[-0.16, 0.08], [0.14, 0.12], [0, -0.12]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'onion' || kind === 'onionChopped') {
    ctx.fillStyle = '#c9a0dc';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#efe0f5';
    ctx.lineWidth = s * 0.05;
    for (const r of [0.28, 0.16]) {
      ctx.beginPath();
      ctx.arc(0, 0, s * r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#8e6bb0';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.4, s * 0.08, s * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A white plate, with any items stacked on it, centred at (x, y). */
export function drawPlate(ctx, items, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.52, size * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9d9d9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.4, size * 0.26, 0, 0, Math.PI * 2);
  ctx.stroke();
  items.forEach((item, i) => {
    drawItem(ctx, item, 0, -i * size * 0.1, size * 0.72);
  });
  ctx.restore();
}

function drawFloor(ctx) {
  ctx.fillStyle = WALL_TOP;
  ctx.fillRect(0, 0, VIEW.width, HUD.height);
  ctx.fillStyle = WALL;
  ctx.fillRect(0, HUD.height - 6, VIEW.width, 6);
  for (let y = FLOOR.y; y < FLOOR.y + FLOOR.h; y += 48) {
    for (let x = FLOOR.x; x < FLOOR.x + FLOOR.w; x += 48) {
      const odd = ((x - FLOOR.x) / 48 + (y - FLOOR.y) / 48) % 2 === 0;
      ctx.fillStyle = odd ? FLOOR_A : FLOOR_B;
      ctx.fillRect(x, y, 48, 48);
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let x = FLOOR.x; x <= FLOOR.x + FLOOR.w; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, FLOOR.y); ctx.lineTo(x, FLOOR.y + FLOOR.h); ctx.stroke();
  }
  for (let y = FLOOR.y; y <= FLOOR.y + FLOOR.h; y += 48) {
    ctx.beginPath(); ctx.moveTo(FLOOR.x, y); ctx.lineTo(FLOOR.x + FLOOR.w, y); ctx.stroke();
  }
  // Wall trim and a woven rug in the middle of the kitchen.
  ctx.fillStyle = '#d94f3d';
  ctx.fillRect(FLOOR.x, FLOOR.y - 4, FLOOR.w, 4);
  ctx.fillStyle = '#c65a3a';
  roundRect(ctx, 520, 330, 240, 120, 10);
  ctx.fill();
  ctx.strokeStyle = '#f2e3c6';
  ctx.lineWidth = 3;
  roundRect(ctx, 532, 342, 216, 96, 8);
  ctx.stroke();
  ctx.fillStyle = '#f2e3c6';
  ctx.beginPath();
  ctx.moveTo(640, 362);
  ctx.lineTo(668, 390);
  ctx.lineTo(640, 418);
  ctx.lineTo(612, 390);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c65a3a';
  ctx.beginPath();
  ctx.arc(640, 390, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawOrderBoard(ctx, world) {
  const { x, y, w, h, gap } = ORDER_CARD;
  text(ctx, 'ORDERS', x + 8, y - 2, 13, '#fff3d6', 'left');
  for (let i = 0; i < 3; i += 1) {
    const cardX = x + i * (w + gap);
    const order = world.orders[i];
    ctx.save();
    if (!order) {
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      roundRect(ctx, cardX, y + 12, w, h - 12, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.5;
      roundRect(ctx, cardX, y + 12, w, h - 12, 10);
      ctx.stroke();
      ctx.restore();
      continue;
    }
    const urgent = order.patience < 12;
    ctx.fillStyle = urgent ? '#ffe1de' : CREAM;
    roundRect(ctx, cardX, y + 12, w, h - 12, 10);
    ctx.fill();
    ctx.strokeStyle = urgent ? RED : '#d8c49a';
    ctx.lineWidth = 2;
    roundRect(ctx, cardX, y + 12, w, h - 12, 10);
    ctx.stroke();
    text(ctx, `#${order.id} ${order.recipe.name}`, cardX + w / 2, y + 28, 14, INK);
    const items = order.recipe.items;
    const iconSize = 30;
    const totalW = items.length * (iconSize + 4);
    let ix = cardX + (w - totalW) / 2 + iconSize / 2;
    for (const item of items) {
      drawItem(ctx, item, ix, y + 56, iconSize);
      ix += iconSize + 4;
    }
    const barW = w - 24;
    const frac = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = '#e5d9bd';
    roundRect(ctx, cardX + 12, y + h - 20, barW, 9, 4);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? GREEN : frac > 0.25 ? '#e8a91c' : RED;
    roundRect(ctx, cardX + 12, y + h - 20, barW * frac, 9, 4);
    ctx.fill();
    text(ctx, `$${order.recipe.price}`, cardX + w - 14, y + 28, 13, GREEN, 'right');
    ctx.restore();
  }
}

function drawHud(ctx, world) {
  // Right-hand cluster: timer, coins, hearts, streak.
  const right = 1256;
  const left = world.shiftLeft;
  const minutes = Math.floor(left / 60);
  const seconds = Math.floor(left % 60).toString().padStart(2, '0');
  const timeColor = world.rush ? '#ffb347' : '#fff3d6';
  text(ctx, `${minutes}:${seconds}`, right - 180, 34, 30, timeColor);
  text(ctx, world.rush ? 'RUSH HOUR' : 'SHIFT', right - 180, 62, 12, '#ffd9a0');
  text(ctx, `$${world.coins}`, right - 60, 34, 22, '#f7c948', 'right');
  text(ctx, `served ${world.served}`, right - 60, 62, 13, '#fff3d6', 'right');
  let hx = right - 330;
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < world.hearts ? RED : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    const cx = hx + i * 30;
    ctx.arc(cx - 6, 88, 7, 0, Math.PI * 2);
    ctx.arc(cx + 6, 88, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 12, 88);
    ctx.lineTo(cx, 100);
    ctx.lineTo(cx + 12, 88);
    ctx.fill();
  }
  if (world.streak >= 2) {
    text(ctx, `STREAK x${world.streak}`, right - 180, 88, 14, '#ffb347');
  }
}

function drawStation(ctx, world, id, station) {
  const { x, y, w, h } = station;
  const near = world.nearest && world.nearest.id === id;
  ctx.save();
  // Counter body.
  ctx.fillStyle = COUNTER_SIDE;
  roundRect(ctx, x, y + 8, w, h - 8, 8);
  ctx.fill();
  ctx.fillStyle = COUNTER_TOP;
  roundRect(ctx, x - 3, y, w + 6, 20, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 2;
  roundRect(ctx, x - 3, y, w + 6, 20, 8);
  ctx.stroke();
  if (near) {
    ctx.strokeStyle = '#fff3d6';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    roundRect(ctx, x - 7, y - 7, w + 14, h + 14, 12);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  text(ctx, station.label, x + w / 2, y + h - 12, 12, '#fff3d6');

  if (station.kind === 'bin') {
    // A crate of the ingredient, with its icon on top.
    ctx.fillStyle = '#7a4a21';
    roundRect(ctx, x + w / 2 - 30, y - 26, 60, 34, 6);
    ctx.fill();
    drawItem(ctx, station.gives, x + w / 2, y - 8, 44);
  } else if (station.kind === 'grill') {
    ctx.fillStyle = '#4a4a4a';
    roundRect(ctx, x + 12, y - 30, w - 24, 40, 6);
    ctx.fill();
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + 20 + i * 46, y - 26);
      ctx.lineTo(x + 20 + i * 46, y + 6);
      ctx.stroke();
    }
    // Hot coals glow while a patty cooks.
    if (world.grill.some((p) => p && p.state === 'raw')) {
      ctx.fillStyle = 'rgba(255,120,40,0.35)';
      roundRect(ctx, x + 16, y - 26, w - 32, 32, 5);
      ctx.fill();
    }
    world.grill.forEach((patty, slot) => {
      if (!patty) return;
      const px = x + 50 + slot * 100;
      const py = y - 10;
      drawItem(ctx, patty.state === 'raw' ? 'patty' : patty.state === 'cooked' ? 'pattyCooked' : 'pattyBurnt', px, py, 52);
      const total = patty.state === 'raw' ? GRILL_SECONDS : GRILL_SECONDS + GRILL_BURN_AFTER;
      const frac = Math.min(1, patty.t / total);
      ctx.fillStyle = '#222';
      ctx.fillRect(px - 26, py - 32, 52, 7);
      ctx.fillStyle = patty.state === 'burnt' ? RED : patty.state === 'cooked' ? '#ffb347' : GREEN;
      ctx.fillRect(px - 26, py - 32, 52 * frac, 7);
      if (patty.state === 'cooked') text(ctx, 'READY!', px, py - 42, 11, '#ffb347');
      if (patty.state === 'burnt') text(ctx, 'BURNT!', px, py - 42, 11, RED);
    });
  } else if (station.kind === 'board') {
    ctx.fillStyle = '#e8c98f';
    roundRect(ctx, x + 16, y - 28, w - 32, 36, 6);
    ctx.fill();
    const job = world.board;
    if (job) {
      drawItem(ctx, job.item, x + w / 2, y - 10, 46);
      const frac = Math.min(1, job.t / CHOP_SECONDS);
      ctx.fillStyle = '#c9a86a';
      ctx.fillRect(x + 24, y - 34, w - 48, 7);
      ctx.fillStyle = job.done ? GREEN : '#e8a91c';
      ctx.fillRect(x + 24, y - 34, (w - 48) * frac, 7);
      if (job.done) text(ctx, 'READY!', x + w / 2, y - 44, 11, GREEN);
    } else {
      ctx.fillStyle = '#b08d55';
      text(ctx, 'chop here', x + w / 2, y - 10, 12, '#8a6a3e');
    }
  } else if (station.kind === 'plates') {
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y - 4 - i * 8, 34, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d9d9d9';
      ctx.stroke();
    }
  } else if (station.kind === 'counter') {
    world.counter.forEach((held, slot) => {
      if (!held) return;
      const cx = x + 50 + slot * 100;
      if (held.plate) drawPlate(ctx, held.items, cx, y - 6, 64);
      else drawItem(ctx, held.item, cx, y - 10, 48);
    });
  } else if (station.kind === 'serve') {
    ctx.fillStyle = '#2e9e4f';
    roundRect(ctx, x + 10, y - 26, w - 20, 30, 6);
    ctx.fill();
    text(ctx, 'SERVE HERE', x + w / 2, y - 10, 13, '#ffffff');
  } else if (station.kind === 'trash') {
    ctx.fillStyle = '#555';
    roundRect(ctx, x + w / 2 - 26, y - 30, 52, 40, 6);
    ctx.fill();
    ctx.fillStyle = '#333';
    roundRect(ctx, x + w / 2 - 30, y - 34, 60, 10, 4);
    ctx.fill();
  }
  ctx.restore();
}

function drawChef(ctx, world) {
  const chef = world.chef;
  const bob = chef.moving ? Math.sin(chef.bob) * 3 : 0;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob);
  ctx.scale(1.2, 1.2);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 18 - bob, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: white apron, red neckerchief.
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, -17, -8, 34, 30, 12);
  ctx.fill();
  ctx.fillStyle = '#d94f3d';
  ctx.beginPath();
  ctx.moveTo(-8, -6);
  ctx.lineTo(8, -6);
  ctx.lineTo(0, 4);
  ctx.closePath();
  ctx.fill();
  // Head and toque.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(0, -20, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-8, -30, 8, 0, Math.PI * 2);
  ctx.arc(0, -34, 9, 0, Math.PI * 2);
  ctx.arc(8, -30, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-14, -32, 28, 6);
  // Eyes look the way the chef faces.
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(chef.face * 4 - 4, -20, 1.8, 0, Math.PI * 2);
  ctx.arc(chef.face * 4 + 4, -20, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // What the chef carries, held up above the toque.
  const held = world.hands;
  if (held) {
    ctx.save();
    ctx.translate(0, -52);
    if (held.plate) drawPlate(ctx, held.items, 0, 0, 58);
    else drawItem(ctx, held.item, 0, 0, 44);
    ctx.restore();
  }
  ctx.restore();
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const p of world.popups) {
    ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    text(ctx, p.text, p.x, p.y, 20, p.color);
  }
  ctx.globalAlpha = 1;
}

function drawHint(ctx, world) {
  const near = world.nearest;
  if (!near) return;
  const fresh = world.hint && world.time - (world.hintAt || 0) < 3;
  const label = fresh ? world.hint : (near.station.hint || '');
  if (!label) return;
  text(ctx, `[E] ${near.station.label} — ${label}`, 640, 700, 15, '#fff3d6');
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(40,20,8,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'SIZZLE & SERVE', 640, 240, 56, '#ffd9a0');
  text(ctx, 'Rush Hour Kitchen', 640, 292, 28, '#fff3d6');
  text(ctx, 'Take orders. Grill patties. Chop veggies. Serve before patience runs out!', 640, 336, 18, '#fff3d6');
  const lines = [
    'WASD / Arrows — move around the kitchen',
    'E or Space — use a station    •    Click a station to use it too',
    'Patties grill on the GRILL (don\'t let them burn!)',
    'Tomato, lettuce and onion need the CHOP BOARD',
    'Build dishes on a PLATE, set it on the COUNTER, SERVE it at the window',
    '3 walk-outs end your shift early — 150 seconds, then the rush!',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 386 + i * 28, 16, '#ffe9c4'));
  text(ctx, 'Press Enter or click to start cooking!', 640, 592, 20, '#f7c948');
  text(ctx, 'A 150-second shift · tips for fast service · streaks pay extra', 640, 622, 14, '#ffd9a0');
}

function drawOver(ctx, world) {
  const s = shiftSummary(world);
  ctx.fillStyle = 'rgba(40,20,8,0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'SHIFT OVER!', 640, 205, 52, '#ffd9a0');
  text(ctx, `Grade ${s.grade}`, 640, 262, 32, '#f7c948');
  const rows = [
    [`Coins earned`, `$${s.coins}`],
    [`Dishes served`, `${s.served}`],
    [`Orders walked out`, `${s.missed}`],
    [`Wrong plates served`, `${s.wrongServes}`],
    [`Best streak`, `x${s.bestStreak}`],
    [`Service accuracy`, `${s.accuracy}%`],
  ];
  rows.forEach(([label, value], i) => {
    text(ctx, label, 520, 322 + i * 34, 19, '#fff3d6', 'right');
    text(ctx, value, 780, 322 + i * 34, 19, '#f7c948', 'left');
  });
  text(ctx, 'Press R to cook another shift', 640, 570, 20, '#fff3d6');
}

/** Draw the whole world onto `ctx` (a 1280x720 canvas). */
export function drawWorld(ctx, world) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx);
  for (const [id, station] of Object.entries(STATIONS)) drawStation(ctx, world, id, station);
  drawChef(ctx, world);
  drawParticles(ctx, world);
  drawOrderBoard(ctx, world);
  drawHud(ctx, world);
  drawHint(ctx, world);
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  else if (world.screen === SCREEN_OVER) drawOver(ctx, world);
  if (world.screen === SCREEN_PLAY && world.rush) {
    text(ctx, 'RUSH HOUR — orders pay extra!', 640, 130, 15, '#ffb347');
  }
}
