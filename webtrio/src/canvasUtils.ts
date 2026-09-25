const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;

const SQUARE_SIZE = 30;

/** Rows drawn inside the board outline. */
export let visibleRows = 20;
/** Extra rows above the visible board that pieces may occupy. */
export let bufferRows = 20;
/** Total addressable rows, visible plus buffer. */
export let rows = visibleRows + bufferRows;
export let columns = 10;

/** Top-left corner of the visible board within the canvas, in CSS pixels. */
let originX = 0;
let originY = 0;

/** Canvas size in CSS pixels. */
let cssWidth = 0;
let cssHeight = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  cssWidth = window.innerWidth;
  cssHeight = window.innerHeight;

  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  originX = Math.round((cssWidth - columns * SQUARE_SIZE) / 2);
  originY = Math.round((cssHeight - visibleRows * SQUARE_SIZE) / 2);
}

export function drawGrid() {
  ctx.strokeStyle = 'gray';
  ctx.lineWidth = 1;
  for (let i = 1; i < columns; i++) {
    let x = originX + i * SQUARE_SIZE - 0.5;
    ctx.beginPath();
    ctx.moveTo(x, originY);
    ctx.lineTo(x, originY + visibleRows * SQUARE_SIZE);
    ctx.stroke();
  }

  for (let i = 1; i < visibleRows; i++) {
    let y = originY + i * SQUARE_SIZE - 0.5;
    ctx.beginPath();
    ctx.moveTo(originX, y);
    ctx.lineTo(originX + columns * SQUARE_SIZE, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'black';
  ctx.strokeRect(
    originX - 0.5,
    originY - 0.5,
    columns * SQUARE_SIZE + 1,
    visibleRows * SQUARE_SIZE + 1,
  );
}

export let drawBuffer = new Uint32Array(rows * columns);

/**
 * Resizes the board, discarding its contents. Call this when starting a game
 * whose dimensions differ from the previous one.
 *
 * @param buffer rows above the visible board that pieces may occupy
 */
export function setBoardSize(width: number, height: number, buffer = height) {
  columns = width;
  visibleRows = height;
  bufferRows = buffer;
  rows = visibleRows + bufferRows;
  drawBuffer = new Uint32Array(rows * columns);
  resize();
  draw();
}

export function draw() {
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  drawGrid();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const color = drawBuffer[row * columns + col];
      if (color !== 0) {
        // rows at or above visibleRows sit above the board outline, so they are
        // dimmed to mark them as being in the buffer zone
        ctx.globalAlpha = row < visibleRows ? 1 : 0.4;
        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.fillRect(
          originX + col * SQUARE_SIZE,
          originY + (visibleRows - 1 - row) * SQUARE_SIZE,
          SQUARE_SIZE,
          SQUARE_SIZE,
        );
      }
    }
  }
  ctx.globalAlpha = 1;
}

window.addEventListener('resize', () => {
  resize();
  draw();
});

resize();
draw();
