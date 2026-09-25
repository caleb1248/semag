import { Pieces } from '../colors';
import type { Vec2 } from '../types';
import type { GameState } from './gameState';

export function spawnPiece(state: GameState) {
  const nextPiece = state.queue.shift()!;
  state.queue.push(state.pieceOrder.next());
  state.current.piece = nextPiece;
  state.current.center = getSpawnPosition(nextPiece, state);
  state.current.rotation = 0;
}

const PIECE_TABLE: Record<Pieces, Vec2[]> = {
  [Pieces.I]: [
    [-1.5, 0.5],
    [-0.5, 0.5],
    [0.5, 0.5],
    [1.5, 0.5],
  ],
  [Pieces.J]: [
    [-1, 1],
    [-1, 0],
    [0, 0],
    [1, 0],
  ],
  [Pieces.L]: [
    [-1, 0],
    [0, 0],
    [1, 0],
    [1, 1],
  ],
  [Pieces.O]: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  [Pieces.S]: [
    [-1, 0],
    [0, 0],
    [0, 1],
    [1, 1],
  ],
  [Pieces.T]: [
    [-1, 0],
    [0, 0],
    [1, 0],
    [0, 1],
  ],
  [Pieces.Z]: [
    [-1, 1],
    [0, 1],
    [0, 0],
    [1, 0],
  ],
};

/**
 * @param rotation 0 for top, 1 for right, 2 for bottom, 3 for left
 */
function rotatePoint(x: number, y: number, rotation: number): Vec2 {
  if (rotation === 0) return [x, y];
  if (rotation === 1) return [y, -x];
  if (rotation === 2) return [-x, -y];
  if (rotation === 3) return [-y, x];
  throw new Error(`Invalid rotation: ${rotation}`);
}

export function getSquaresTaken(
  piece: Pieces,
  center: { x: number; y: number },
  rotation: number,
): Vec2[] {
  const offsets = PIECE_TABLE[piece];
  return offsets.map(([x, y]) => {
    const [rx, ry] = piece === Pieces.O ? [x, y] : rotatePoint(x, y, rotation);
    return [center.x + rx, center.y + ry];
  });
}

function getSpawnPosition(piece: Pieces, gameState: GameState): Vec2 {
  const width = gameState.settings.width;
  const result: Vec2 = [gameState.settings.height + 2, 0];

  if (width % 2 === 0) {
    // lets say its 4 wide, then we want to spawn at 1, which is (4-1)/2
    result[0] = width / 2 - 1;
  } else {
    // lets say its 5 wide, then we want to spawn at 2, which is (5-1)/2
    result[0] = (width - 1) / 2;
  }

  if (piece === Pieces.I) {
    result[0] += 0.5;
    result[1] -= 0.5;
  }

  return result;
}
