export interface Blip {
  r: number;
  g: number;
  b: number;
}

export interface BlipsConfig {
  INITIAL_R: number;
  INITIAL_G: number;
  INITIAL_B: number;

  GROW_R: number;
  EAT_R: number;
  DIE_R: number;
  STARVE_R: number;
  GROW_SELF_R: number;
  GROW_OTHER_R: number;

  GROW_B: number;
  EAT_B: number;
  DIE_B: number;
  STARVE_B: number;
  GROW_SELF_B: number;
  GROW_OTHER_B: number;
  EATEN_SELF_B: number;
  EATEN_OTHER_B: number;

  GROW_G: number;
  DIE_G: number;
  GROW_SELF_G: number;
  GROW_OTHER_G: number;
  EATEN_SELF_G: number;
  EATEN_OTHER_G: number;
}

export function useBlips(config: BlipsConfig) {
  const cellSize = 5;

  let current: Blip[][] = [];
  let next: Blip[][] = [];

  let gridWidth = 0;
  let gridHeight = 0;

  function init(width: number, height: number) {
    gridWidth = width;
    gridHeight = height;

    current = createBlipsArray(width, height);
    next = createBlipsArray(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        current[y][x] = {
          r: Math.floor(Math.random() * config.INITIAL_R),
          g: Math.floor(Math.random() * config.INITIAL_G),
          b: Math.floor(Math.random() * config.INITIAL_B),
        };
      }
    }
  }

  function createBlipsArray(width: number, height: number) {
    const arr: Blip[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Blip[] = [];
      for (let x = 0; x < width; x++) {
        row.push({ r: 0, g: 0, b: 0 });
      }
      arr.push(row);
    }
    return arr;
  }

  function process() {
    if (gridHeight === 0 || gridWidth === 0) return;

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const self = current[y][x];

        let totalRed = 0,
          totalGreen = 0,
          totalBlue = 0;
        let neighborCount = 0;

        for (let ny = y - 1; ny <= y + 1; ny++) {
          for (let nx = x - 1; nx <= x + 1; nx++) {
            if (nx === x && ny === y) continue;
            if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
              totalRed += current[ny][nx].r;
              totalGreen += current[ny][nx].g;
              totalBlue += current[ny][nx].b;
              neighborCount++;
            }
          }
        }

        const avgRed = neighborCount > 0 ? totalRed / neighborCount : 0;
        const avgGreen = neighborCount > 0 ? totalGreen / neighborCount : 0;
        const avgBlue = neighborCount > 0 ? totalBlue / neighborCount : 0;

        //process red
        const growRedSelf = self.b * config.GROW_R * config.GROW_SELF_R;
        const growRedOther = avgBlue * config.GROW_R * config.GROW_OTHER_R;
        const starveRedSelf = starveValue(
          self.r,
          (totalBlue + self.b) / (neighborCount + 1)
        ) * config.STARVE_R;
        const removeRed = self.r * config.DIE_R + starveRedSelf;
        const addRed = growRedSelf + growRedOther;
        const newR = roundColour(self.r + addRed - removeRed);

        //process blue
        const growBlueSelf = self.g * config.GROW_B * config.GROW_SELF_B;
        const growBlueOther = avgGreen * config.GROW_B * config.GROW_OTHER_B;
        const eatenBlueSelf = self.r * config.EAT_R * config.EATEN_SELF_B;
        const eatenBlueOther = avgRed * config.EAT_R * config.EATEN_OTHER_B;
        const starveBlueSelf = starveValue(
          self.b,
          (totalGreen + self.g) / (neighborCount + 1)
        ) * config.STARVE_B;
        const removeBlue =
          self.b * config.DIE_B + eatenBlueSelf + eatenBlueOther + starveBlueSelf;
        const addBlue = growBlueSelf + growBlueOther;
        const newB = roundColour(self.b + addBlue - removeBlue);

        //process green
        const growGreenSelf = self.g * config.GROW_G * config.GROW_SELF_G;
        const growGreenOther = avgGreen * config.GROW_G * config.GROW_OTHER_G;
        const eatenGreenSelf = self.b * config.EAT_B * config.EATEN_SELF_G;
        const eatenGreenOther = avgBlue * config.EAT_B * config.EATEN_OTHER_G;
        const removeGreen = self.g * config.DIE_G + eatenGreenSelf + eatenGreenOther;
        const addGreen = growGreenSelf + growGreenOther;
        const newG = roundColour(self.g + addGreen - removeGreen);

        next[y][x].r = newR;
        next[y][x].g = newG;
        next[y][x].b = newB;
      }
    }

    const temp = current;
    current = next;
    next = temp;
  }

  function draw(ctx: CanvasRenderingContext2D) {
    if (gridHeight === 0 || gridWidth === 0) return;

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const { r, g, b } = current[y][x];
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  function calculateAverageRGB() {
    if (!gridHeight || !gridWidth) {
      return { r: 0, g: 0, b: 0 };
    }

    let totalR = 0,
      totalG = 0,
      totalB = 0;
    let count = gridWidth * gridHeight;

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const { r, g, b } = current[y][x];
        totalR += r;
        totalG += g;
        totalB += b;
      }
    }

    return {
      r: totalR / count,
      g: totalG / count,
      b: totalB / count,
    };
  }

  function starveValue(eater: number, eaten: number) {
    return eater > eaten ? eater - eaten : 0;
  }

  function roundColour(c: number) {
    if (c < 0) return 0;
    if (c > 255) return 255;
    return Math.round(c);
  }

  return {
    cellSize,
    init,
    process,
    draw,
    calculateAverageRGB,
  };
}
