import Phaser from "phaser";

export const drawAtmosphereGlow = (
  g: Phaser.GameObjects.Graphics,
  r: number,
  centerY: number
) => {
  g.clear();

  const layers = 70;
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const rad = r * (1.01 + t * 0.10);
    const a = 0.09 * Math.pow(1 - t, 2.1);

    g.lineStyle(2, 0x9fd6ff, a);
    g.strokeCircle(0, centerY+9, rad);
  }
};
