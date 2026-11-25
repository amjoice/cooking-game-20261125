// A tiny seeded random generator (mulberry32), so a screenshot seed always
// replays the same orders, the same spawns and the same frame.
export function makeRandom(seed) {
  let state = seed >>> 0;
  if (state === 0) state = 0x9e3779b9;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one element of `list` with the seeded generator. */
export function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

/** Fisher-Yates shuffle that returns a new array, driven by the seeded generator. */
export function shuffled(random, list) {
  const out = list.slice();
  for (let index = out.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    const held = out[index];
    out[index] = out[other];
    out[other] = held;
  }
  return out;
}
