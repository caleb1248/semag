import { setBoardSize } from '../canvasUtils';
import type { Pieces } from '../colors';
import type { Vec2 } from '../types';
import { spawnPiece } from './piece';
import type { PieceOrder } from './pieceOrder';
import * as pieceOrder from './pieceOrder';

export interface GameState {
  queue: Pieces[];
  current: {
    piece: Pieces;
    center: Vec2;
    /** 0 for top, 1 for right, 2 for bottom, 3 for left */
    rotation: number;
  };

  hold: Pieces | null;
  board: (Pieces | null)[][];

  pieceOrder: PieceOrder;
  settings: GameSettings;
}

export interface GameSettings {
  randomType: '7bag' | 'random';
  width: number;
  height: number;
}

export function newGame(settings: GameSettings): GameState {
  setBoardSize(settings.width, settings.height);

  const state: GameState = {
    queue: [],
    current: {
      piece: 0,
      center: [0, 0],
      rotation: 0,
    },
    hold: null,
    board: Array(settings.height)
      .fill(null)
      .map(() => Array(settings.width).fill(null)),
    pieceOrder: settings.randomType === '7bag' ? pieceOrder.bag(7) : pieceOrder.random(),
    settings,
  };

  spawnPiece(state);

  return state;
}
