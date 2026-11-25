// Keyboard and mouse input, kept apart from the game rules so the world can be
// stepped headlessly (screenshots, tests) with a scripted input instead.
export function createInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    interactPressed: false, // edge: true for one frame after the key/mouse goes down
    mouseX: 0,
    mouseY: 0,
    mousePressed: false, // edge: true for one frame after a click
    anyKeyPressed: false, // edge: any key, used to leave title / end screens
  };
}

const KEY_MAP = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

/** Wire the browser's keyboard and mouse into `input`. Returns a cleanup function. */
export function attachInput(input, canvas) {
  function onKeyDown(event) {
    const field = KEY_MAP[event.code];
    if (field) {
      input[field] = true;
      event.preventDefault();
    }
    if (event.code === 'KeyE' || event.code === 'Space') {
      if (!event.repeat) input.interactPressed = true;
      event.preventDefault();
    }
    if (!event.repeat) input.anyKeyPressed = true;
  }
  function onKeyUp(event) {
    const field = KEY_MAP[event.code];
    if (field) input[field] = false;
  }
  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    input.mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
  }
  function onMouseDown(event) {
    onMouseMove(event);
    input.mousePressed = true;
    input.anyKeyPressed = true;
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  return function detach() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mousedown', onMouseDown);
  };
}

/** Clear the one-frame edge flags after the world has read them. */
export function clearEdges(input) {
  input.interactPressed = false;
  input.mousePressed = false;
  input.anyKeyPressed = false;
}

/** Direction the chef wants to move, normalised, from the held keys. */
export function moveDirection(input) {
  const x = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const y = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (x === 0 && y === 0) return { x: 0, y: 0 };
  const length = Math.hypot(x, y);
  return { x: x / length, y: y / length };
}
