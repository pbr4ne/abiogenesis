import { emitter } from '../utilities/emitter';

export function startLoop() {

  const TICK_RATE = 50;
  let lastTick = Date.now();
  let _gameLoopId: number;

  const gameLoop = () => {
    const now = Date.now();
    const delta = now - lastTick;

    if (delta >= TICK_RATE) {
      lastTick = now;
      
      emitter.emit('updateGrid');
    }

    _gameLoopId = requestAnimationFrame(gameLoop);
  };

  _gameLoopId = requestAnimationFrame(gameLoop);
}
