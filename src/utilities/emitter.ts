import mitt from 'mitt';

type GameEvent = {
  //actions
  updateGrid: void;
};

export const emitter = mitt<GameEvent>();
