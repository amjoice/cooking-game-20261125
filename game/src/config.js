// Sizzle & Serve: Rush Hour Kitchen — configuration.
// One file holds every number the game balances on: the kitchen layout, the
// recipes, the timers and the scoring, so tuning never touches the logic.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const SHIFT_SECONDS = 150;
export const RUSH_AT = 30; // seconds left when rush hour starts
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 3;
export const FIRST_ORDER_AT = 2; // seconds into the shift
export const ORDER_GAP_EASY = 16; // seconds between new orders, early shift
export const ORDER_GAP_LATE = 11; // seconds between new orders, late shift
export const ORDER_PATIENCE = 55; // seconds an order waits before it walks out
export const RUSH_PATIENCE = 40;

export const GRILL_SECONDS = 5; // raw patty -> cooked
export const GRILL_BURN_AFTER = 15; // cooked patty -> burnt if left longer
export const CHOP_SECONDS = 2.5; // tomato / lettuce / onion on the board

export const CHEF_SPEED = 300; // px per second
export const CHEF_RADIUS = 24;
export const INTERACT_RANGE = 62; // px from a station's edge

// Ingredients. prep: none | grill | chop. icon is the drawing key render.js knows.
export const INGREDIENTS = {
  bun: { name: 'Bun', prep: 'none', color: '#e8a95c' },
  patty: { name: 'Patty', prep: 'grill', color: '#7a4a21' },
  tomato: { name: 'Tomato', prep: 'chop', color: '#e2483d' },
  lettuce: { name: 'Lettuce', prep: 'chop', color: '#58b368' },
  cheese: { name: 'Cheese', prep: 'none', color: '#f7c948' },
  onion: { name: 'Onion', prep: 'chop', color: '#c9a0dc' },
};

// A finished item on a plate is one of these: raw names, or cooked/chopped results.
export const ITEMS = {
  bun: { label: 'Bun', kind: 'bun' },
  pattyCooked: { label: 'Grilled patty', kind: 'pattyCooked' },
  pattyBurnt: { label: 'Burnt patty', kind: 'pattyBurnt' },
  tomatoChopped: { label: 'Tomato slices', kind: 'tomatoChopped' },
  lettuceChopped: { label: 'Shredded lettuce', kind: 'lettuceChopped' },
  onionChopped: { label: 'Diced onion', kind: 'onionChopped' },
  cheese: { label: 'Cheese', kind: 'cheese' },
};

// Recipes: the dishes the order board asks for. price is the base pay in coins;
// tip is added on top, scaled by how much patience is left when served.
export const RECIPES = [
  {
    id: 'classic',
    name: 'Classic Burger',
    items: ['bun', 'pattyCooked', 'lettuceChopped', 'tomatoChopped'],
    price: 14,
  },
  {
    id: 'cheese',
    name: 'Cheese Melt',
    items: ['bun', 'pattyCooked', 'cheese'],
    price: 12,
  },
  {
    id: 'garden',
    name: 'Garden Salad',
    items: ['lettuceChopped', 'tomatoChopped', 'onionChopped'],
    price: 11,
  },
  {
    id: 'double',
    name: 'Double Stack',
    items: ['bun', 'pattyCooked', 'pattyCooked', 'cheese', 'lettuceChopped'],
    price: 20,
  },
  {
    id: 'onion',
    name: 'Onion Burger',
    items: ['bun', 'pattyCooked', 'onionChopped', 'cheese'],
    price: 15,
  },
  {
    id: 'veggie',
    name: 'Veggie Stack',
    items: ['bun', 'lettuceChopped', 'tomatoChopped', 'cheese', 'onionChopped'],
    price: 16,
  },
];

// Kitchen layout. Stations are rectangles the chef walks around; each one has an
// anchor point in open floor where the chef stands to use it.
export const STATIONS = {
  binBun: { x: 60, y: 128, w: 96, h: 64, kind: 'bin', gives: 'bun', label: 'BUNS', hint: 'take a bun', anchor: [108, 232] },
  binPatty: { x: 168, y: 128, w: 96, h: 64, kind: 'bin', gives: 'patty', label: 'PATTIES', hint: 'take a raw patty', anchor: [216, 232] },
  binTomato: { x: 276, y: 128, w: 96, h: 64, kind: 'bin', gives: 'tomato', label: 'TOMATO', hint: 'take a tomato', anchor: [324, 232] },
  binLettuce: { x: 384, y: 128, w: 96, h: 64, kind: 'bin', gives: 'lettuce', label: 'LETTUCE', hint: 'take lettuce', anchor: [432, 232] },
  binCheese: { x: 492, y: 128, w: 96, h: 64, kind: 'bin', gives: 'cheese', label: 'CHEESE', hint: 'take cheese', anchor: [540, 232] },
  binOnion: { x: 600, y: 128, w: 96, h: 64, kind: 'bin', gives: 'onion', label: 'ONION', hint: 'take an onion', anchor: [648, 232] },
  grill: { x: 780, y: 128, w: 220, h: 78, kind: 'grill', slots: 2, label: 'GRILL', hint: 'grill a patty · take it when done', anchor: [890, 246] },
  board: { x: 1060, y: 128, w: 160, h: 78, kind: 'board', label: 'CHOP BOARD', hint: 'chop tomato, lettuce, onion', anchor: [1140, 246] },
  plates: { x: 60, y: 560, w: 110, h: 76, kind: 'plates', label: 'PLATES', hint: 'take a clean plate', anchor: [115, 520] },
  counter: { x: 240, y: 560, w: 300, h: 76, kind: 'counter', slots: 3, label: 'COUNTER', hint: 'set down · add to a plate · pick up', anchor: [390, 520] },
  serve: { x: 640, y: 560, w: 220, h: 76, kind: 'serve', label: 'SERVE', hint: 'serve the finished plate', anchor: [750, 520] },
  trash: { x: 1060, y: 560, w: 160, h: 76, kind: 'trash', label: 'TRASH', hint: 'throw it away', anchor: [1140, 520] },
};

// Walkable floor bounds (inside the walls, below the HUD, above the floor trim).
export const FLOOR = { x: 36, y: 210, w: 1208, h: 336 };

// HUD layout.
export const HUD = { height: 112 };
export const ORDER_CARD = { x: 24, y: 14, w: 218, h: 86, gap: 12 };
