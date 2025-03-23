import mitt from 'mitt';

type GameEvent = {
  //actions
  updateGrid: void;
  updateSpeed: number;
  updateAverageRGB: { r: number; g: number; b: number };
};

export const emitter = mitt<GameEvent>();
