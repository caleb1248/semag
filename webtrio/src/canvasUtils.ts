const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;

const SQUARE_SIZE = 30;

export let rows = Math.floor(canvas.height / SQUARE_SIZE);
export let columns = Math.floor(canvas.width / SQUARE_SIZE);

export function drawGrid() {
  let columns = Math.floor(canvas.width / SQUARE_SIZE);
  ctx.strokeStyle = 'gray';
  for (let i = 1; i < columns; i++) {
    let x = i * SQUARE_SIZE - 0.5;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  let rows = Math.floor(canvas.height / SQUARE_SIZE);
  for (let i = 1; i < rows; i++) {
    let y = i * SQUARE_SIZE - 0.5;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

export const drawBuffer = new Uint32Array(rows * columns);

export function draw() {
  drawGrid();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const color = drawBuffer[row * columns + col];
      if (color !== 0) {
        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.fillRect(col * SQUARE_SIZE, (rows - 1 - row) * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
      }
    }
  }
}

drawGrid();
