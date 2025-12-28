import Phaser from "phaser";
import { Rotator } from "./sphereMath";

export const revealRandomVisibleCell = (
  revealed: boolean[][],
  divisions: number,
  r: number,
  rotate: Rotator,
  maxTries = 4000,
) => {
  for (let i = 0; i < maxTries; i++) {
    const latI = Phaser.Math.Between(0, divisions - 1);
    const lonI = Phaser.Math.Between(0, divisions - 1);

    if (revealed[latI][lonI]) {
      continue;
    }

    const latMid = Phaser.Math.Linear(-Math.PI / 2, Math.PI / 2, (latI + 0.5) / divisions);
    const lonMid = Phaser.Math.Linear(-Math.PI, Math.PI, (lonI + 0.5) / divisions);

    const px = r * Math.cos(latMid) * Math.sin(lonMid);
    const py = r * Math.sin(latMid);
    const pz = r * Math.cos(latMid) * Math.cos(lonMid);

    const p = rotate(px, py, pz);
    if (p.z < 0) {
      continue;
    }

    revealed[latI][lonI] = true;
    return { latI, lonI };
  }

  return null;
};
