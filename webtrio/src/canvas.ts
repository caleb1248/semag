import type { Vec2 } from "./types";

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

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
  ctx.strokeStyle = "gray";
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

  ctx.strokeStyle = "black";
  ctx.strokeRect(
    originX - 0.5,
    originY - 0.5,
    columns * SQUARE_SIZE + 1,
    visibleRows * SQUARE_SIZE + 1,
  );
}

/** Width of a preview panel, in cells. */
const PANEL_COLUMNS = 4;
/** Height of one preview slot, in cells. */
const SLOT_ROWS = 3;
/** Space between the board outline and a preview panel, in CSS pixels. */
const PANEL_GAP = 12;
/** Height of the labelled strip at the top of a panel, in CSS pixels. */
const PANEL_HEADER = 24;
/** Space between a panel border and its contents, in CSS pixels. */
const PANEL_PADDING = 12;

/** A piece to show in a preview panel, as offsets around its own centre. */
export interface Preview {
  squares: Vec2[];
  color: number;
  /** Greys the piece out, marking it as unusable. */
  dimmed?: boolean;
}

let holdPreview: Preview | null = null;
let nextPreviews: Preview[] = [];

/** Sets what the hold and next panels show on the following `draw()`. */
export function setPreviews(hold: Preview | null, next: Preview[]) {
  holdPreview = hold;
  nextPreviews = next;
}

function drawPreview(preview: Preview, panelX: number, slotY: number) {
  const xs = preview.squares.map(([x]) => x);
  const ys = preview.squares.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // centre the piece's bounding box inside its slot
  const left = panelX + ((PANEL_COLUMNS - (maxX - minX + 1)) * SQUARE_SIZE) / 2;
  const top = slotY + ((SLOT_ROWS - (maxY - minY + 1)) * SQUARE_SIZE) / 2;

  ctx.globalAlpha = preview.dimmed ? 0.3 : 1;
  ctx.fillStyle = `#${preview.color.toString(16).padStart(6, "0")}`;
  for (const [x, y] of preview.squares) {
    // board coordinates count upwards, screen coordinates downwards
    ctx.fillRect(
      left + (x - minX) * SQUARE_SIZE,
      top + (maxY - y) * SQUARE_SIZE,
      SQUARE_SIZE,
      SQUARE_SIZE,
    );
  }
  ctx.globalAlpha = 1;
}

/** Draws a labelled, outlined panel `slots` preview slots tall. */
function drawPanel(label: string, x: number, slots: number) {
  ctx.fillStyle = "gray";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(label, x, originY + PANEL_HEADER - 7);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  ctx.strokeRect(
    x - PANEL_PADDING - 0.5,
    originY - PANEL_PADDING - 0.5,
    PANEL_COLUMNS * SQUARE_SIZE + 2 * PANEL_PADDING + 1,
    PANEL_HEADER + slots * SLOT_ROWS * SQUARE_SIZE + 2 * PANEL_PADDING + 1,
  );
}

function drawPanels() {
  const holdX =
    originX - PANEL_GAP - PANEL_PADDING - PANEL_COLUMNS * SQUARE_SIZE;
  const nextX = originX + columns * SQUARE_SIZE + PANEL_GAP + PANEL_PADDING;

  drawPanel("HOLD", holdX, 1);
  drawPanel("NEXT", nextX, Math.max(nextPreviews.length, 1));

  const slotsY = originY + PANEL_HEADER;
  if (holdPreview !== null) drawPreview(holdPreview, holdX, slotsY);
  for (let i = 0; i < nextPreviews.length; i++) {
    drawPreview(nextPreviews[i]!, nextX, slotsY + i * SLOT_ROWS * SQUARE_SIZE);
  }
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
  drawPanels();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const color = drawBuffer[row * columns + col];
      if (color !== 0) {
        // rows at or above visibleRows sit above the board outline, so they are
        // dimmed to mark them as being in the buffer zone
        ctx.globalAlpha = row < visibleRows ? 1 : 0.4;
        ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
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

window.addEventListener("resize", () => {
  resize();
  draw();
});

resize();
draw();
