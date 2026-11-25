// Sizzle & Serve: the browser entry point. It owns the canvas, the frame loop
// and the screens; the rules live in world.js, the pixels in render.js.
// With ?shot=start|play|end&seed=N in the URL it renders one deterministic
// screenshot scene instead of the interactive game (see shots.js).
import { STATIONS, VIEW } from './config.js';
import { attachInput, clearEdges, createInput, moveDirection } from './input.js';
import { createAudio, ensureAudio, sfx } from './audio.js';
import { drawWorld } from './render.js';
import {
  SCREEN_OVER,
  SCREEN_PLAY,
  SCREEN_TITLE,
  createWorld,
  interact,
  nearestStation,
  resetWorld,
  stepWorld,
} from './world.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;
const shotSeconds = Number(params.get('seconds') || '') || null;

const world = createWorld(seed);
const input = createInput();
const audio = createAudio();
attachInput(input, canvas);

const SOUNDS = {
  pickup: sfx.pickup,
  place: sfx.place,
  chop: sfx.chop,
  chopDone: sfx.chopDone,
  sizzle: sfx.sizzle,
  grillDone: sfx.grillDone,
  serve: sfx.serve,
  wrong: sfx.wrong,
  walkout: sfx.walkout,
  newOrder: sfx.newOrder,
  rush: sfx.rush,
};

function drainEvents() {
  for (const name of world.events) {
    const play = SOUNDS[name];
    if (play) play(audio);
  }
  world.events.length = 0;
}

/** Which station (if any) sits under a mouse click. */
function stationAt(x, y) {
  for (const [id, station] of Object.entries(STATIONS)) {
    if (x >= station.x - 6 && x <= station.x + station.w + 6
      && y >= station.y - 6 && y <= station.y + station.h + 6) {
      return { id, station };
    }
  }
  return null;
}

let paused = false;
let clickGoal = null; // { x, y } — the chef walks here, then uses the station
let lastCode = '';
window.addEventListener('keydown', (event) => {
  lastCode = event.code;
  if (event.code === 'KeyM') audio.muted = !audio.muted;
});

function frame() {
  requestAnimationFrame(frame);
  const dt = 1 / 60;

  if (input.anyKeyPressed || input.mousePressed) ensureAudio(audio);

  if (world.screen === SCREEN_TITLE) {
    if (input.anyKeyPressed || input.mousePressed) {
      resetWorld(world);
      sfx.click(audio);
      statusEl.textContent = 'Shift started. Take the first order!';
    }
  } else if (world.screen === SCREEN_PLAY) {
    if (input.anyKeyPressed && lastCode === 'KeyP') paused = !paused;
    if (!paused) {
      const dir = moveDirection(input);
      let dx = dir.x;
      let dy = dir.y;
      if (clickGoal) {
        const gx = clickGoal.x - world.chef.x;
        const gy = clickGoal.y - world.chef.y;
        const dist = Math.hypot(gx, gy);
        if (dist < 14) {
          world.hint = interact(world);
          world.hintAt = world.time;
          clickGoal = null;
        } else {
          dx = gx / dist;
          dy = gy / dist;
        }
      }
      if (input.mousePressed) {
        const hit = stationAt(input.mouseX, input.mouseY);
        if (hit) clickGoal = { x: hit.station.anchor[0], y: hit.station.anchor[1] };
        else clickGoal = null;
      }
      if (input.interactPressed && !clickGoal) {
        world.hint = interact(world);
        world.hintAt = world.time;
      }
      stepWorld(world, { dx, dy, interact: false }, dt);
      world.nearest = nearestStation(world);
      drainEvents();
      if (world.screen === SCREEN_OVER) {
        statusEl.textContent = `Shift over. You earned $${world.coins} and served ${world.served} dishes.`;
      }
    }
  } else if (world.screen === SCREEN_OVER) {
    if (input.anyKeyPressed && (lastCode === 'KeyR' || lastCode === 'Enter')) {
      resetWorld(world);
      statusEl.textContent = 'New shift started.';
    }
  }

  drawWorld(ctx, world);
  if (paused && world.screen === SCREEN_PLAY) {
    ctx.fillStyle = 'rgba(40,20,8,0.5)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fff3d6';
    ctx.font = '700 40px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED — press P to resume', VIEW.width / 2, VIEW.height / 2);
  }
  clearEdges(input);
}

// Screenshot mode: stage the scene once, then paint it every frame.
if (shotName) {
  const staged = stageShot(shotName, world, shotSeconds);
  world.screen = staged.screen;
  document.title = `Sizzle & Serve — ${shotName}`;
  requestAnimationFrame(() => drawWorld(ctx, world));
} else {
  requestAnimationFrame(frame);
}
