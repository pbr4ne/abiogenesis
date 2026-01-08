import Phaser from "phaser";

export const drawAtmosphereGlow = (
  g: Phaser.GameObjects.Graphics,
  r: number,
  centerY: number,
  strength01: number
) => {
  g.clear();

  const s = Phaser.Math.Clamp(strength01, 0, 1);
  if (s <= 0) return;

  const easeOut = (t: number) => 1 - Math.pow(1 - t, 2);
  const se = easeOut(s);

  const sRolloff = Math.pow(s, 1.35);

  const layers = Math.round(55 + 95 * se);
  const maxOutMul = Phaser.Math.Linear(0.07, 0.26, se);

  const baseAlpha = Phaser.Math.Linear(0.035, 0.085, se);

  const falloffExp = Phaser.Math.Linear(3.6, 1.85, se);

  const baseLineW = Phaser.Math.Linear(1.8, 4.6, se);

  const startInsetMul = 0;
  
  const endOutMul = startInsetMul + maxOutMul;

  for (let i = 0; i < layers; i++) {
    const t = layers === 1 ? 0 : i / (layers - 1);
    const tt = Math.pow(t, Phaser.Math.Linear(0.85, 1.15, se));

    const outMul = Phaser.Math.Linear(startInsetMul, endOutMul, tt);

    const rad = r * (1 + outMul + 0);

    const w = baseLineW * (0.75 + 1.25 * tt);

    const a = baseAlpha * Math.pow(1 - tt, falloffExp) * sRolloff;

    g.lineStyle(w, 0x9fd6ff, a);
    g.strokeCircle(0, centerY, rad);
  }
};
