import type { Pieces } from '../colors';

export interface PieceOrder {
  next(): Pieces;
}

export function random(): PieceOrder {
  return {
    next: () => Math.floor(Math.random() * 7) as Pieces,
  };
}

export function bag(length: number): PieceOrder {
  const bag: Pieces[] = Array.from({ length }, (_, i) => (i % 7) as Pieces);
  let index = 0;

  return {
    next: () => {
      if (index >= bag.length) {
        // shuffle the bag
        for (let i = bag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        index = 0;
      }
      return bag[index++] as Pieces;
    },
  };
}
