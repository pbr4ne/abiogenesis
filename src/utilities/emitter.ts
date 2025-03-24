import mitt from 'mitt';

type GameEvent = {
  //actions
  updateGrid: void;
  updateSpeed: number;
  updateAverageRGB: { r: number; g: number; b: number };
  reset: void;
  pause: void;
  play: void;
  changeBlipConfig: string;
};

export const emitter = mitt<GameEvent>();
