// Screenshot scenes for ?shot=start|play|end. Each one plays the real rules
// forward from a fresh world with a fixed seed, steered by a small autopilot
// that walks the chef between stations and uses them, so every frame is what a
// short game really looks like and the same seed always gives the same frame.
import { STEP, STATIONS } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, interact, nearestStation, resetWorld, stepWorld } from './world.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 55;
const END_LIMIT_SECONDS = 170;

/** True when every item of `have` fits inside `want`, counting duplicates. */
function isSubset(have, want) {
  const remaining = want.slice();
  for (const item of have) {
    const at = remaining.indexOf(item);
    if (at === -1) return false;
    remaining.splice(at, 1);
  }
  return true;
}

function missingItems(have, want) {
  const remaining = want.slice();
  for (const item of have) {
    const at = remaining.indexOf(item);
    if (at !== -1) remaining.splice(at, 1);
  }
  return remaining;
}

/**
 * Build the bot's step list for the first open order. A step is
 * { station, wait }: walk to the station, use it, then wait `wait` seconds
 * (for the grill to finish, or the board to chop) before the next step.
 */
export function buildPlan(world) {
  const order = world.orders[0];
  const steps = [];
  const hands = world.hands;

  // A stray single item, or a plate that fits no open order, goes in the trash
  // first — and the rest of the plan is built for empty hands after it.
  let plateInHands = false;
  let have = [];
  if (hands && !hands.plate) {
    steps.push({ station: 'trash', wait: 0 });
  } else if (hands && hands.plate && (!order || !isSubset(hands.items, order.recipe.items))) {
    steps.push({ station: 'trash', wait: 0 });
  } else if (hands && hands.plate) {
    plateInHands = true;
    have = hands.items.slice();
  }
  if (!order) {
    steps.push({ station: 'counter', wait: 1 });
    return steps;
  }

  // Reclaim a usable plate from the counter, if one sits there.
  if (!plateInHands) {
    const plateSlot = world.counter.findIndex((c) => c && c.plate);
    if (plateSlot !== -1 && isSubset(world.counter[plateSlot].items, order.recipe.items)) {
      steps.push({ station: 'counter', wait: 0 });
      plateInHands = true;
      have = world.counter[plateSlot].items.slice();
    }
  }
  if (!plateInHands) {
    steps.push({ station: 'plates', wait: 0 });
    steps.push({ station: 'counter', wait: 0 });
    have = [];
  }

  const missing = missingItems(have, order.recipe.items);
  // Patties go on the grill first so they cook while the bot chops: the grill
  // has two slots, so every patty is placed before any chopping starts.
  const patties = missing.filter((item) => item === 'pattyCooked');
  const chopped = missing.filter((item) => item.endsWith('Chopped'));
  const plain = missing.filter((item) => item !== 'pattyCooked' && !item.endsWith('Chopped'));

  // Take every cooked patty off the grill (into hands, then onto the plate).
  // Two grill steps per patty: the first takes one, the second takes the next
  // once hands are free again; a step with nothing to take is a harmless no-op.
  const takePatties = (waitFirst) => {
    for (const _item of patties) {
      steps.push({ station: 'grill', wait: waitFirst ? 6 : 0 });
      steps.push({ station: 'grill', wait: 0 });
      if (!plateInHands) steps.push({ station: 'counter', wait: 0 });
      waitFirst = false;
    }
  };

  for (const _item of patties) {
    steps.push({ station: 'binPatty', wait: 0 });
    steps.push({ station: 'grill', wait: 0 });
  }
  // Chop, collecting the patties after the first chop so none burns while the
  // board is busy; a second collection at the end covers a chop-free order.
  chopped.forEach((item, index) => {
    const bin = item === 'tomatoChopped' ? 'binTomato' : item === 'lettuceChopped' ? 'binLettuce' : 'binOnion';
    steps.push({ station: bin, wait: 0 });
    steps.push({ station: 'board', wait: 3 });
    steps.push({ station: 'board', wait: 0 });
    if (!plateInHands) steps.push({ station: 'counter', wait: 0 });
    if (index === 0) takePatties(false);
  });
  takePatties(chopped.length === 0);
  for (const item of plain) {
    const bin = item === 'bun' ? 'binBun' : 'binCheese';
    steps.push({ station: bin, wait: 0 });
    if (!plateInHands) steps.push({ station: 'counter', wait: 0 });
  }
  if (!plateInHands) steps.push({ station: 'counter', wait: 0 });
  steps.push({ station: 'serve', wait: 0 });
  return steps;
}

/** True when the plate the chef carries matches an open order right now. */
function plateMatchesOrder(world) {
  const hands = world.hands;
  if (!hands || !hands.plate) return false;
  return world.orders.some((order) => {
    const wanted = order.recipe.items.slice().sort();
    const got = hands.items.slice().sort();
    return wanted.length === got.length && wanted.every((item, i) => item === got[i]);
  });
}

/** Walk the bot through its plans for `seconds` of simulated play. */
export function runBot(world, seconds) {
  let elapsed = 0;
  let plan = [];
  let stepIndex = 0;
  let stuck = 0;
  while (elapsed < seconds && world.screen === SCREEN_PLAY) {
    if (plan.length === 0 || stepIndex >= plan.length) {
      plan = buildPlan(world);
      stepIndex = 0;
    }
    const step = plan[stepIndex];
    const station = STATIONS[step.station];
    const [ax, ay] = station.anchor;
    const near = nearestStation(world);
    if (near && near.id === step.station) {
      // Never serve a plate whose order already walked out: trash it and plan
      // the next order instead of taking the wrong-serve penalty.
      if (step.station === 'serve' && !plateMatchesOrder(world)) {
        plan = [{ station: 'trash', wait: 0 }];
        stepIndex = 0;
        continue;
      }
      interact(world);
      const waits = Math.round(step.wait / STEP);
      for (let i = 0; i < waits && elapsed < seconds && world.screen === SCREEN_PLAY; i += 1) {
        stepWorld(world, null, STEP);
        elapsed += STEP;
      }
      stepIndex += 1;
      stuck = 0;
    } else {
      const dx = ax - world.chef.x;
      const dy = ay - world.chef.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      stepWorld(world, { dx: dx / len, dy: dy / len, interact: false }, STEP);
      elapsed += STEP;
      stuck += STEP;
      if (stuck > 12) {
        stepIndex += 1; // give up on this step rather than stall the shot
        stuck = 0;
      }
    }
  }
}

/**
 * Set `world` to the named scene (start, play or end; any other name is start)
 * and return the screen to draw over it.
 */
export function stageShot(name, world, seconds = null) {
  resetWorld(world);
  if (name !== 'play' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) stepWorld(world, null, STEP);
    world.nearest = nearestStation(world);
    return { screen: SCREEN_TITLE };
  }
  if (name === 'play') {
    runBot(world, seconds ?? PLAY_SECONDS);
    world.nearest = nearestStation(world);
    return { screen: SCREEN_PLAY };
  }
  runBot(world, END_LIMIT_SECONDS);
  world.screen = SCREEN_OVER;
  return { screen: SCREEN_OVER };
}
