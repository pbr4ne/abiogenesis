import { emitter } from '../utilities/emitter';

let tickRate = 50;
let lastTick = Date.now();
let _gameLoopId: number;
let paused = false;

const gameLoop = () => {
  if (!paused) {
    const now = Date.now();
    const delta = now - lastTick;

    if (delta >= tickRate) {
      lastTick = now;
      emitter.emit('updateGrid');
    }
  }

  _gameLoopId = requestAnimationFrame(gameLoop);
};

export function startLoop() {
  _gameLoopId = requestAnimationFrame(gameLoop);
}

emitter.on('updateSpeed', (newSpeed: number) => {
  if (newSpeed === 0) {
    paused = true;
  } else {
    paused = false;
    tickRate = 100 - newSpeed;
  }
});
