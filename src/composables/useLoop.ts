import { emitter } from '../utilities/emitter';

let tickRate = 60;
let lastTick = Date.now();
let _gameLoopId: number;
let paused = true;

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
  tickRate = 100 - newSpeed;
});

emitter.on('pause', () => {
  paused = true;
});

emitter.on('play', () => {
  paused = false;
});