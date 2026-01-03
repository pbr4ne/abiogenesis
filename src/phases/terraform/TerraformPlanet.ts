import Phaser from "phaser";
import PlanetBase from "../../planet/PlanetBase";
import { pickCellByNearestProjectedCenter } from "../../planet/PlanetMath";
import MagnetosphereRenderer from "./MagnetosphereRenderer";
import TerraformingState from "./TerraformingState";
import { drawAtmosphereGlow } from "./AtmosphereRenderer";
import { log } from "../../utilities/GameUtils";
import { generateAltGrid, terrainColour, toHex } from "./HydrosphereTerrain";

type Key = "atmosphere" | "magnetosphere" | "hydrosphere";
type Mask = Partial<Record<Key, boolean>>;

export default class TerraformPlanet extends PlanetBase {
  private progress: TerraformingState;

  private enabledEffects: Required<Record<Key, boolean>>;
  private enabledHotspots: Required<Record<Key, boolean>>;

  private hotspotGroups: {
    key: Key;
    event: string;
    baseA: number;
    hoverA: number;
    colourHex: string;
    cells: { row: number; col: number }[];
    cellSet: Set<string>;
  }[] = [];

  private hoveredGroupKey: Key | null = null;

  private magnetosphereRenderer?: MagnetosphereRenderer;
  private atmosphereGlow?: Phaser.GameObjects.Graphics;
  private hydroAlt?: number[][];
  private hydroInit = false;

  constructor(
    scene: Phaser.Scene,
    x = 960,
    y = 540,
    progress: TerraformingState,
    enabledEffects: Mask = {},
    enabledHotspots?: Mask
  ) {
    super(scene, x, y);

    this.progress = progress;

    this.enabledEffects = {
      atmosphere: enabledEffects.atmosphere ?? true,
      magnetosphere: enabledEffects.magnetosphere ?? true,
      hydrosphere: enabledEffects.hydrosphere ?? true
    };

    const hs = enabledHotspots ?? enabledEffects;
    this.enabledHotspots = {
      atmosphere: hs.atmosphere ?? true,
      magnetosphere: hs.magnetosphere ?? true,
      hydrosphere: hs.hydrosphere ?? true
    };

    this.buildHotspots();
    this.wireHotspotInput();

    const onChange = (k: any) => this.applyEffect(k);
    this.progress.on("change", onChange);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.progress.off("change", onChange);
      this.magnetosphereRenderer?.destroy();
      this.magnetosphereRenderer = undefined;
    });

    this.applyAllEffects();
  }

  private ensureHydroAlt() {
    if (this.hydroInit) return;
    this.hydroInit = true;
    this.hydroAlt = generateAltGrid(this.divisions, this.divisions);
  }

  private buildHotspots() {
    const keyOf = (row: number, col: number) => `${row},${col}`;

    const atmosphereCells = () => {
      const out: { row: number; col: number }[] = [];
      for (let row = 0; row <= 4; row++) {
        for (let col = 0; col <= this.divisions - 1; col++) {
          out.push({ row, col });
        }
      }
      return out;
    };

    const magnetosphereCells: { row: number; col: number }[] = [
      { row: 15, col: 7 }, { row: 16, col: 7 }, { row: 17, col: 7 }, { row: 18, col: 7 }, { row: 19, col: 7 },
      { row: 15, col: 8 }, { row: 16, col: 8 }, { row: 17, col: 8 }, { row: 18, col: 8 }, { row: 19, col: 8 }, { row: 20, col: 8 }, { row: 21, col: 8 },
      { row: 15, col: 9 }, { row: 16, col: 9 }, { row: 17, col: 9 }, { row: 18, col: 9 }, { row: 19, col: 9 }, { row: 20, col: 9 }, { row: 21, col: 9 },
      { row: 15, col: 10 }, { row: 16, col: 10 }, { row: 17, col: 10 }, { row: 18, col: 10 }, { row: 19, col: 10 }, { row: 20, col: 10 }, { row: 21, col: 10 }
    ];

    const allGroups: TerraformPlanet["hotspotGroups"] = [
      {
        key: "atmosphere",
        event: "ui:goToAtmosphere",
        baseA: 0.45,
        hoverA: 0.85,
        colourHex: "#ffd84d",
        cells: atmosphereCells(),
        cellSet: new Set<string>()
      },
      {
        key: "magnetosphere",
        event: "ui:goToMagnetosphere",
        baseA: 0.45,
        hoverA: 0.85,
        colourHex: "#9dff4d",
        cells: magnetosphereCells,
        cellSet: new Set<string>()
      },
      {
        key: "hydrosphere",
        event: "ui:goToHydrosphere",
        baseA: 0.45,
        hoverA: 0.85,
        colourHex: "#4dffff",
        cells: [
          { row: 10, col: 15 }, { row: 11, col: 15 }, { row: 12, col: 15 }, { row: 13, col: 15 }, { row: 14, col: 15 }, { row: 15, col: 15 },
          { row: 10, col: 16 }, { row: 11, col: 16 }, { row: 12, col: 16 }, { row: 13, col: 16 }, { row: 14, col: 16 }, { row: 15, col: 16 },
          { row: 10, col: 17 }, { row: 11, col: 17 }, { row: 12, col: 17 }, { row: 13, col: 17 }, { row: 14, col: 17 }, { row: 15, col: 17 },
          { row: 10, col: 18 }, { row: 11, col: 18 }, { row: 12, col: 18 }, { row: 13, col: 18 }, { row: 14, col: 18 }, { row: 15, col: 18 },
          { row: 10, col: 19 }, { row: 11, col: 19 }, { row: 12, col: 19 }, { row: 13, col: 19 }, { row: 14, col: 19 }, { row: 15, col: 19 }
        ],
        cellSet: new Set<string>()
      }
    ];

    this.hotspotGroups = allGroups.filter(g => this.enabledHotspots[g.key]);

    for (const g of this.hotspotGroups) {
      for (const c of g.cells) {
        g.cellSet.add(keyOf(c.row, c.col));
        this.gridData.setHex(c.row, c.col, g.colourHex, g.baseA);
      }
    }

    this.lastRevealAt = this.scene.time.now;
    this.redrawTiles();
  }

  private wireHotspotInput() {
    this.scene.events.on(Phaser.Scenes.Events.WAKE, this.clearHotspotHover, this);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.events.off(Phaser.Scenes.Events.WAKE, this.clearHotspotHover, this);
    });

    this.hitZone.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      const dx = pointer.worldX - this.x;
      const dy = pointer.worldY - this.y;

      const cell = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.rotate);

      let nextKey: Key | null = null;

      if (cell) {
        const k = `${cell.row},${cell.col}`;
        for (const g of this.hotspotGroups) {
          if (g.cellSet.has(k)) {
            nextKey = g.key;
            break;
          }
        }
      }

      if (nextKey === this.hoveredGroupKey) return;

      if (this.hoveredGroupKey !== null) {
        const prev = this.hotspotGroups.find(g => g.key === this.hoveredGroupKey)!;
        for (const c of prev.cells) this.gridData.setHex(c.row, c.col, prev.colourHex, prev.baseA);
        this.scene.input.setDefaultCursor("default");
      }

      this.hoveredGroupKey = nextKey;

      if (nextKey !== null) {
        const cur = this.hotspotGroups.find(g => g.key === nextKey)!;
        for (const c of cur.cells) this.gridData.setHex(c.row, c.col, cur.colourHex, cur.hoverA);
        this.scene.input.setDefaultCursor("pointer");
      }

      this.redrawTiles();
    });

    this.hitZone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const dx = pointer.worldX - this.x;
      const dy = pointer.worldY - this.y;

      const cell = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.rotate);
      if (!cell) return;

      const k = `${cell.row},${cell.col}`;

      for (const g of this.hotspotGroups) {
        if (g.cellSet.has(k)) {
          this.clearHotspotHover();
          this.scene.events.emit(g.event);
          return;
        }
      }
    });
  }

  private clearHotspotHover() {
    if (!this.hotspotGroups?.length) return;

    this.hoveredGroupKey = null;

    for (const g of this.hotspotGroups) {
      for (const c of g.cells) this.gridData.setHex(c.row, c.col, g.colourHex, g.baseA);
    }

    this.redrawTiles();
    this.scene.input.setDefaultCursor("default");
  }

  private applyAllEffects() {
    this.applyEffect("atmosphere");
    this.applyEffect("magnetosphere");
    this.applyEffect("hydrosphere");
  }

  private applyEffect(k: Key) {
    if (!this.enabledEffects[k]) {
      this.disableEffect(k);
      return;
    }

    if (k === "atmosphere") {
      log("TerraformPlanet: applyEffect atmosphere");
      //this.applyAtmosphere(this.progress.atmosphere01);
      this.applyAtmosphere(5);
      return;
    }

    if (k === "magnetosphere") {
      this.applyMagnetosphere(this.progress.magnetosphere01);
      return;
    }

    this.applyHydrosphere(this.progress.waterLevel);
  }

  private disableEffect(k: Key) {
    if (k === "magnetosphere") {
      this.magnetosphereRenderer?.destroy();
      this.magnetosphereRenderer = undefined;
    }
  }

  private applyAtmosphere(strength01: number) {
    if (strength01 <= 0) {
      this.atmosphereGlow?.clear();
      return;
    }

    if (!this.atmosphereGlow) {
      this.atmosphereGlow = this.scene.add.graphics();

      this.add(this.atmosphereGlow);

      this.atmosphereGlow.setBlendMode(Phaser.BlendModes.ADD);
    }

    drawAtmosphereGlow(
      this.atmosphereGlow,
      this.r,
      0,
      strength01
    );
  }

  private applyMagnetosphere(strength01: number) {
    if (!this.magnetosphereRenderer) {
      this.magnetosphereRenderer = new MagnetosphereRenderer(this.scene, this.behind, {
        r: this.r,
        centerX: 0,
        centerY: 0,
        lineAlpha: 0.2,
        lineWidth: 2,
        perSideLines: 5,
        loopCenterOffsetMul: 1,
        innerRadiusMul: 0.15,
        outerRadiusMul: 1.35,
        strengthOverride01: 1
      });
    }

    this.magnetosphereRenderer.setStrength01(strength01);
  }

  private applyHydrosphere(waterLevel: number) {
    this.ensureHydroAlt();
    if (!this.hydroAlt) return;

    const rows = this.divisions;
    const cols = this.divisions;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const alt = this.hydroAlt[r][c];

        const col = terrainColour(alt, waterLevel);
        this.gridData.setHex(r, c, toHex(col), 1);
      }
    }

    for (const g of this.hotspotGroups) {
      for (const cell of g.cells) {
        const a = (this.hoveredGroupKey === g.key) ? g.hoverA : g.baseA;
        this.gridData.setHex(cell.row, cell.col, g.colourHex, a);
      }
    }

    this.redrawTiles();
  }
}
