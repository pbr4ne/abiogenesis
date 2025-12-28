import Phaser from "phaser";

export type StarLayerSpec = {
  count: number;
  minR: number;
  maxR: number;
  alpha: number;
  depth: number;
};

export type Starfield = {
  layers: Phaser.GameObjects.Graphics[];
  destroy: () => void;
  rebuild: () => void;
};

const createStarLayer = (
  scene: Phaser.Scene,
  count: number,
  minR: number,
  maxR: number,
  alpha: number,
  depth: number,
) => {
  const g = scene.add.graphics();
  g.setDepth(depth);
  g.setScrollFactor(0);

  const w = scene.scale.width;
  const h = scene.scale.height;

  for (let i = 0; i < count; i++) {
    const x = Phaser.Math.FloatBetween(0, w);
    const y = Phaser.Math.FloatBetween(0, h);
    const r = Phaser.Math.FloatBetween(minR, maxR);

    g.fillStyle(0xffffff, alpha);
    g.fillCircle(x, y, r);
  }

  return g;
};

export const createStarfield = (
  scene: Phaser.Scene,
  bgCam: Phaser.Cameras.Scene2D.Camera,
  gameCam: Phaser.Cameras.Scene2D.Camera,
  specs: StarLayerSpec[] = [
    { count: 200, minR: 0.5, maxR: 1.2, alpha: 0.25, depth: -1002 },
    { count: 140, minR: 1.0, maxR: 2.0, alpha: 0.55, depth: -1001 },
    { count: 70, minR: 1.5, maxR: 2.0, alpha: 0.9, depth: -1000 },
  ],
): Starfield => {
  let layers: Phaser.GameObjects.Graphics[] = [];

  const destroy = () => {
    for (const layer of layers) {
      layer.destroy();
    }
    layers = [];
  };

  const rebuild = () => {
    destroy();

    layers = specs.map(s => createStarLayer(scene, s.count, s.minR, s.maxR, s.alpha, s.depth));

    for (const layer of layers) {
      gameCam.ignore(layer);
    }
  };

  rebuild();

  return {
    get layers() {
      return layers;
    },
    destroy,
    rebuild,
  };
};
