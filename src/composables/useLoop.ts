import { emitter } from '../utilities/emitter';

let tickRate = 50;
let lastTick = Date.now();
let _gameLoopId: number;

const gameLoop = () => {
  const now = Date.now();
  const delta = now - lastTick;

  if (delta >= tickRate) {
    lastTick = now;
    emitter.emit('updateGrid');
  }

  _gameLoopId = requestAnimationFrame(gameLoop);
};

export function startLoop() {
  _gameLoopId = requestAnimationFrame(gameLoop);
}

emitter.on('updateSpeed', (newSpeed) => {
  tickRate = newSpeed === Infinity ? 9999999 : newSpeed;
});
