// Sizzle & Serve: the kitchen itself. The world owns the chef, the stations, the
// orders and the shift clock, and steps them forward in fixed 1/60s ticks. It
// knows nothing about the canvas or the browser: render.js draws what it holds,
// main.js feeds it input, and shots.js drives it with a scripted autopilot.
// Events the world emits (world.events, drained each frame) are: 'pickup',
// 'place', 'chop', 'chopDone', 'sizzle', 'grillDone', 'serve', 'wrong',
// 'walkout', 'newOrder', 'rush', 'burnt'.
import {
  CHEF_RADIUS,
  CHEF_SPEED,
  CHOP_SECONDS,
  FLOOR,
  GRILL_BURN_AFTER,
  GRILL_SECONDS,
  INGREDIENTS,
  INTERACT_RANGE,
  MAX_HEARTS,
  MAX_ORDERS,
  ORDER_GAP_EASY,
  ORDER_GAP_LATE,
  ORDER_PATIENCE,
  RECIPES,
  RUSH_AT,
  RUSH_PATIENCE,
  SHIFT_SECONDS,
  STATIONS,
  STEP,
  FIRST_ORDER_AT,
} from './config.js';
import { makeRandom, pick } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const EVENT_OVER = 1;

// What a carried thing is: { plate: boolean, items: string[] } for a plate,
// or { plate: false, item: string } for a single ingredient. null = empty hands.
export function emptyHands() {
  return null;
}

function plateWith(items) {
  return { plate: true, items: items.slice() };
}

function singleItem(kind) {
  return { plate: false, item: kind };
}

/** A fresh world for one shift. `seed` drives orders and spawns. */
export function createWorld(seed = 1) {
  const random = makeRandom(seed);
  return {
    seed,
    random,
    screen: SCREEN_TITLE,
    time: 0, // seconds since the shift started
    shiftLeft: SHIFT_SECONDS,
    rush: false,
    rushAnnounced: false,
    chef: { x: 640, y: 400, face: 1, moving: false, bob: 0 },
    hands: null,
    grill: [null, null], // each: null | { item: 'patty', t: seconds on grill, state }
    board: null, // null | { item: 'tomato', t: seconds chopping }
    counter: [null, null, null], // each: null | carried-thing
    orders: [], // { id, recipe, patience, maxPatience, served }
    nextOrderId: 1,
    nextOrderIn: FIRST_ORDER_AT,
    hearts: MAX_HEARTS,
    coins: 0,
    served: 0,
    missed: 0,
    wrongServes: 0,
    streak: 0,
    bestStreak: 0,
    popups: [], // { x, y, text, color, t, life }
    particles: [], // { x, y, vx, vy, t, life, color, size }
    floats: [], // { x, y, text, color, t } — order-card feedback
    events: [],
    stats: { chopped: 0, grilled: 0, trashed: 0 },
  };
}

export function resetWorld(world) {
  const fresh = createWorld(world.seed);
  for (const key of Object.keys(fresh)) world[key] = fresh[key];
  world.screen = SCREEN_PLAY;
}

/** Seconds left on the shift, never below zero. */
export function shiftLeft(world) {
  return Math.max(0, SHIFT_SECONDS - world.time);
}

function emit(world, name) {
  world.events.push(name);
}

function popup(world, x, y, text, color) {
  world.popups.push({ x, y, text, color, t: 0, life: 1.4 });
}

function spawnParticles(world, x, y, color, count, speed = 60) {
  for (let i = 0; i < count; i += 1) {
    const angle = world.random() * Math.PI * 2;
    const v = speed * (0.4 + world.random() * 0.8);
    world.particles.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v - 30,
      t: 0, life: 0.6 + world.random() * 0.4, color,
      size: 2 + world.random() * 3,
    });
  }
}

// ---------------------------------------------------------------- orders

function spawnOrder(world) {
  if (world.orders.length >= MAX_ORDERS) return;
  const recipe = pick(world.random, RECIPES);
  const patience = world.rush ? RUSH_PATIENCE : ORDER_PATIENCE;
  world.orders.push({
    id: world.nextOrderId,
    recipe,
    patience,
    maxPatience: patience,
    bornAt: world.time,
  });
  world.nextOrderId += 1;
  emit(world, 'newOrder');
}

function updateOrders(world, dt) {
  // New orders arrive on a timer that quickens as the shift goes on.
  world.nextOrderIn -= dt;
  if (world.nextOrderIn <= 0) {
    spawnOrder(world);
    const progress = world.time / SHIFT_SECONDS;
    const gap = ORDER_GAP_EASY + (ORDER_GAP_LATE - ORDER_GAP_EASY) * progress;
    world.nextOrderIn = gap * (0.85 + world.random() * 0.3);
  }
  for (let i = world.orders.length - 1; i >= 0; i -= 1) {
    const order = world.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      world.orders.splice(i, 1);
      world.missed += 1;
      world.streak = 0;
      world.hearts = Math.max(0, world.hearts - 1);
      popup(world, 640, 200, 'Order walked out!  -1 ♥', '#e2483d');
      emit(world, 'walkout');
      if (world.hearts === 0) endShift(world);
    }
  }
}

// ---------------------------------------------------------------- stations

function stationRect(station) {
  return { x: station.x, y: station.y, w: station.w, h: station.h };
}

/** The nearest station whose edge the chef can reach, or null. */
export function nearestStation(world) {
  const chef = world.chef;
  let best = null;
  let bestDistance = Infinity;
  for (const [id, station] of Object.entries(STATIONS)) {
    const dx = Math.max(station.x - chef.x, 0, chef.x - (station.x + station.w));
    const dy = Math.max(station.y - chef.y, 0, chef.y - (station.y + station.h));
    const distance = Math.hypot(dx, dy);
    if (distance <= INTERACT_RANGE && distance < bestDistance) {
      best = { id, station };
      bestDistance = distance;
    }
  }
  return best;
}

/** Move the chef, sliding along station rectangles and staying on the floor. */
export function moveChef(world, dx, dy, dt) {
  const chef = world.chef;
  const speed = CHEF_SPEED * dt;
  const nx = chef.x + dx * speed;
  const ny = chef.y + dy * speed;
  const blocked = (x, y) => {
    if (x < FLOOR.x + CHEF_RADIUS || x > FLOOR.x + FLOOR.w - CHEF_RADIUS) return true;
    if (y < FLOOR.y + CHEF_RADIUS || y > FLOOR.y + FLOOR.h - CHEF_RADIUS) return true;
    for (const station of Object.values(STATIONS)) {
      const r = stationRect(station);
      const cx = Math.max(r.x, Math.min(x, r.x + r.w));
      const cy = Math.max(r.y, Math.min(y, r.y + r.h));
      if (Math.hypot(x - cx, y - cy) < CHEF_RADIUS - 2) return true;
    }
    return false;
  };
  if (!blocked(nx, chef.y)) chef.x = nx;
  if (!blocked(chef.x, ny)) chef.y = ny;
  chef.moving = dx !== 0 || dy !== 0;
  if (dx !== 0) chef.face = dx > 0 ? 1 : -1;
  if (chef.moving) chef.bob += dt * 10;
}

/** Plate items, in serving order (bottom to top), for a carried thing. */
export function carriedItems(held) {
  if (!held) return [];
  return held.plate ? held.items : [held.item];
}

function plateMatches(recipe, items) {
  if (items.length !== recipe.items.length) return false;
  const wanted = recipe.items.slice().sort();
  const got = items.slice().sort();
  return wanted.every((item, i) => item === got[i]);
}

function orderForPlate(world, items) {
  return world.orders.find((order) => plateMatches(order.recipe, items)) ?? null;
}

// ---------------------------------------------------------------- interaction

/** The chef uses the nearest station. Returns a short label for the HUD hint. */
export function interact(world) {
  const near = nearestStation(world);
  if (!near) return 'nothing';
  const { id, station } = near;
  const hands = world.hands;
  const chef = world.chef;

  if (station.kind === 'bin') {
    const ingredient = station.gives;
    if (!hands) {
      world.hands = singleItem(ingredient);
      emit(world, 'pickup');
      return `took ${INGREDIENTS[ingredient].name}`;
    }
    if (hands.plate) {
      hands.items.push(ingredient);
      emit(world, 'place');
      return `added ${INGREDIENTS[ingredient].name}`;
    }
    return 'hands full';
  }

  if (station.kind === 'grill') {
    for (let slot = 0; slot < world.grill.length; slot += 1) {
      const patty = world.grill[slot];
      if (patty && patty.state === 'cooked' && !hands) {
        world.grill[slot] = null;
        world.hands = singleItem('pattyCooked');
        emit(world, 'pickup');
        return 'took grilled patty';
      }
      if (patty && patty.state === 'cooked' && hands && hands.plate) {
        world.grill[slot] = null;
        hands.items.push('pattyCooked');
        emit(world, 'place');
        return 'added grilled patty';
      }
      if (patty && patty.state === 'burnt') {
        if (hands) return 'burnt patty — empty hands to take it';
        world.grill[slot] = null;
        world.hands = singleItem('pattyBurnt');
        emit(world, 'pickup');
        return 'took burnt patty (trash it!)';
      }
    }
    if (hands && !hands.plate && hands.item === 'patty') {
      const slot = world.grill.findIndex((p) => p === null);
      if (slot !== -1) {
        world.grill[slot] = { item: 'patty', t: 0, state: 'raw' };
        world.hands = null;
        emit(world, 'sizzle');
        spawnParticles(world, station.x + station.w / 2, station.y + 20, '#ffb347', 8, 40);
        return 'patty on the grill';
      }
      return 'grill is full';
    }
    return 'nothing to grill';
  }

  if (station.kind === 'board') {
    const chopped = world.board;
    if (chopped && chopped.done) {
      const result = chopped.result;
      if (!hands) {
        world.board = null;
        world.hands = singleItem(result);
        emit(world, 'pickup');
        return `took ${result}`;
      }
      if (hands.plate) {
        world.board = null;
        hands.items.push(result);
        emit(world, 'place');
        return `added ${result}`;
      }
      return 'hands full';
    }
    if (chopped && !chopped.done) return 'still chopping…';
    if (hands && !hands.plate && INGREDIENTS[hands.item] && INGREDIENTS[hands.item].prep === 'chop') {
      const result = { tomato: 'tomatoChopped', lettuce: 'lettuceChopped', onion: 'onionChopped' }[hands.item];
      world.board = { item: hands.item, result, t: 0, done: false };
      world.hands = null;
      emit(world, 'chop');
      return `chopping ${INGREDIENTS[hands.item].name}`;
    }
    return 'nothing to chop';
  }

  if (station.kind === 'plates') {
    if (!hands) {
      world.hands = plateWith([]);
      emit(world, 'pickup');
      return 'took a plate';
    }
    return 'hands full';
  }

  if (station.kind === 'counter') {
    // Hands empty: pick up what is on the counter. Carrying: set down, or add
    // an ingredient to a plate that sits on the counter.
    if (!hands) {
      const slot = world.counter.findIndex((c) => c !== null);
      if (slot !== -1) {
        world.hands = world.counter[slot];
        world.counter[slot] = null;
        emit(world, 'pickup');
        return 'picked up from counter';
      }
      return 'counter is empty';
    }
    if (!hands.plate) {
      const plateSlot = world.counter.findIndex((c) => c && c.plate);
      if (plateSlot !== -1) {
        world.counter[plateSlot].items.push(hands.item);
        world.hands = null;
        emit(world, 'place');
        return 'added to the plate';
      }
    }
    const free = world.counter.findIndex((c) => c === null);
    if (free !== -1) {
      world.counter[free] = hands;
      world.hands = null;
      emit(world, 'place');
      return 'set down on the counter';
    }
    return 'counter is full';
  }

  if (station.kind === 'trash') {
    if (hands) {
      world.hands = null;
      world.stats.trashed += 1;
      emit(world, 'place');
      return 'trashed it';
    }
    return 'nothing to trash';
  }

  if (station.kind === 'serve') {
    if (!hands || !hands.plate) return 'serve a finished plate here';
    if (hands.items.length === 0) return 'the plate is empty';
    const order = orderForPlate(world, hands.items);
    if (!order) {
      world.wrongServes += 1;
      world.streak = 0;
      popup(world, chef.x, chef.y - 50, 'No order wants this!', '#e2483d');
      emit(world, 'wrong');
      return 'no order matches this plate';
    }
    const tip = Math.round((order.patience / order.maxPatience) * 8);
    const rushBonus = world.rush ? 2 : 0;
    const streakBonus = Math.min(world.streak, 5);
    const earned = order.recipe.price + tip + rushBonus + streakBonus;
    world.coins += earned;
    world.served += 1;
    world.streak += 1;
    world.bestStreak = Math.max(world.bestStreak, world.streak);
    world.orders = world.orders.filter((o) => o !== order);
    world.hands = null;
    popup(world, station.x + station.w / 2, station.y - 10, `+$${earned}`, '#2e9e4f');
    spawnParticles(world, station.x + station.w / 2, station.y, '#f7c948', 14, 90);
    emit(world, 'serve');
    return `served ${order.recipe.name} +$${earned}`;
  }

  return 'nothing';
}

// ---------------------------------------------------------------- cooking timers

function updateGrill(world, dt) {
  for (let slot = 0; slot < world.grill.length; slot += 1) {
    const patty = world.grill[slot];
    if (!patty) continue;
    patty.t += dt;
    if (patty.state === 'raw' && patty.t >= GRILL_SECONDS) {
      patty.state = 'cooked';
      world.stats.grilled += 1;
      emit(world, 'grillDone');
    } else if (patty.state === 'cooked' && patty.t >= GRILL_SECONDS + GRILL_BURN_AFTER) {
      patty.state = 'burnt';
      emit(world, 'burnt');
      popup(world, STATIONS.grill.x + 60 + slot * 80, STATIONS.grill.y - 8, 'Burnt!', '#e2483d');
    }
    if (patty.state === 'raw' && world.random() < dt * 6) {
      world.particles.push({
        x: STATIONS.grill.x + 40 + slot * 90 + world.random() * 40,
        y: STATIONS.grill.y + 30,
        vx: (world.random() - 0.5) * 12, vy: -28 - world.random() * 20,
        t: 0, life: 0.7, color: '#d8d8d8', size: 3 + world.random() * 3,
      });
    }
  }
}

function updateBoard(world, dt) {
  const job = world.board;
  if (!job || job.done) return;
  job.t += dt;
  if (world.random() < dt * 8) {
    spawnParticles(world, STATIONS.board.x + 80, STATIONS.board.y + 30, '#9fe870', 1, 30);
  }
  if (job.t >= CHOP_SECONDS) {
    job.done = true;
    world.stats.chopped += 1;
    emit(world, 'chopDone');
  }
}

function updateParticles(world, dt) {
  for (let i = world.particles.length - 1; i >= 0; i -= 1) {
    const p = world.particles[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 40 * dt;
    if (p.t >= p.life) world.particles.splice(i, 1);
  }
  for (let i = world.popups.length - 1; i >= 0; i -= 1) {
    const p = world.popups[i];
    p.t += dt;
    p.y -= 24 * dt;
    if (p.t >= p.life) world.popups.splice(i, 1);
  }
}

function endShift(world) {
  world.screen = SCREEN_OVER;
  world.shiftLeft = 0;
}

// ---------------------------------------------------------------- step

/** Advance the world one fixed tick. `input` is { dx, dy, interact } or null. */
export function stepWorld(world, input, dt = STEP) {
  if (world.screen !== SCREEN_PLAY) return 0;
  world.time += dt;
  world.shiftLeft = Math.max(0, SHIFT_SECONDS - world.time);

  if (!world.rush && world.shiftLeft <= RUSH_AT) {
    world.rush = true;
    if (!world.rushAnnounced) {
      world.rushAnnounced = true;
      popup(world, 640, 220, 'RUSH HOUR!  Orders pay extra!', '#e2483d');
      emit(world, 'rush');
    }
  }

  if (input) {
    moveChef(world, input.dx ?? 0, input.dy ?? 0, dt);
    if (input.interact) interact(world);
  }

  updateGrill(world, dt);
  updateBoard(world, dt);
  updateOrders(world, dt);
  updateParticles(world, dt);

  if (world.shiftLeft <= 0 && world.screen === SCREEN_PLAY) {
    endShift(world);
    return EVENT_OVER;
  }
  return 0;
}

/** One-line summary of the shift for the end screen. */
export function shiftSummary(world) {
  const accuracy = world.served + world.missed === 0
    ? 100
    : Math.round((world.served / (world.served + world.missed)) * 100);
  return {
    coins: world.coins,
    served: world.served,
    missed: world.missed,
    wrongServes: world.wrongServes,
    bestStreak: world.bestStreak,
    accuracy,
    grade: world.coins >= 220 ? 'S' : world.coins >= 170 ? 'A' : world.coins >= 120 ? 'B' : world.coins >= 70 ? 'C' : 'D',
  };
}
