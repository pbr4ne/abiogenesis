import Phaser from "phaser";

//TODO - this file isn't currently used
export const randomHex = () => {
  const n = Phaser.Math.Between(0, 0xffffff);
  return "#" + n.toString(16).padStart(6, "0");
};

export const generateColours = (colours: string[][] | undefined, divisions: number) => {
  const out: string[][] = [];
  for (let i = 0; i < divisions; i++) {
    out[i] = [];
    for (let j = 0; j < divisions; j++) {
      const v = colours?.[i]?.[j];
      out[i][j] = typeof v === "string" && v.startsWith("#") ? v : randomHex();
    }
  }
  return out;
};

export const createRevealGrid = (divisions: number) => {
  return Array.from({ length: divisions }, () => Array(divisions).fill(false));
};

export const toPhaserColour = (hex: string) => {
  return Phaser.Display.Color.HexStringToColor(hex).color;
};
