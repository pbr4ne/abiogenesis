import mitt from 'mitt';

type GameEvent = {
  //actions
  updateGrid: void;
  updateSpeed: number;
};

export const emitter = mitt<GameEvent>();
