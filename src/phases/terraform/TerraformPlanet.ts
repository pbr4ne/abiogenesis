import Phaser from "phaser";
import PlanetBase from "../../planet/PlanetBase";
import { pickCellByNearestProjectedCenter } from "../../planet/PlanetMath";
import MagnetosphereRenderer from "./MagnetosphereRenderer";
import TerraformingState from "./TerraformingState";
import { drawAtmosphereGlow } from "./AtmosphereRenderer";
import { log } from "../../utilities/GameUtils";
import PlanetRunState from "../../planet/PlanetRunState";
import { paintHydrosphere } from "./HydrosphereMap";
import { getTerraforming } from "./getTerraformingState";

type Key = "atmosphere" | "magnetosphere" | "hydrosphere";

export default class TerraformPlanet extends PlanetBase {
  private run: PlanetRunState;

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

  constructor(scene: Phaser.Scene, x = 960, y = 540) {
    super(scene, x, y);

    this.run = scene.registry.get("run") as PlanetRunState;
    const tf = getTerraforming(scene);

    this.enabledEffects = { atmosphere: true, magnetosphere: true, hydrosphere: true };
    this.enabledHotspots = { atmosphere: true, magnetosphere: true, hydrosphere: true };

    this.buildHotspots();
    this.wireHotspotInput();

    const onChange = (k: Key) => this.applyEffect(k);
    tf.on("change", onChange);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      tf.off("change", onChange);
      this.magnetosphereRenderer?.destroy();
      this.magnetosphereRenderer = undefined;
    });

    this.applyAllEffects();
  }

  private buildHotspots() {
    const keyOf = (row: number, col: number) => `${row},${col}`;

    const atmosphereCells = () => {
      const out: { row: number; col: number }[] = [];
      for (let row = 0; row <= 3; row++) {
        for (let col = 0; col <= this.divisions - 1; col++) {
          out.push({ row, col });
        }
      }
      return out;
    };

    const magnetosphereCells: { row: number; col: number }[] = [
      { row: 16, col: 7 }, { row: 17, col: 7 }, { row: 18, col: 7 }, { row: 19, col: 7 },
      { row: 16, col: 8 }, { row: 17, col: 8 }, { row: 18, col: 8 }, { row: 19, col: 8 }, { row: 20, col: 8 }, { row: 21, col: 8 },
      { row: 16, col: 9 }, { row: 17, col: 9 }, { row: 18, col: 9 }, { row: 19, col: 9 }, { row: 20, col: 9 }, { row: 21, col: 9 },
      { row: 16, col: 10 }, { row: 17, col: 10 }, { row: 18, col: 10 }, { row: 19, col: 10 }, { row: 20, col: 10 }, { row: 21, col: 10 }
    ];

    const allGroups: TerraformPlanet["hotspotGroups"] = [
      {
        key: "atmosphere",
        event: "ui:goToAtmosphere",
        baseA: 0.45,
        hoverA: 0.85,
        colourHex: "#ff00ff",
        cells: atmosphereCells(),
        cellSet: new Set<string>()
      },
      {
        key: "magnetosphere",
        event: "ui:goToMagnetosphere",
        baseA: 0.45,
        hoverA: 0.85,
        colourHex: "#ff0000",
        cells: magnetosphereCells,
        cellSet: new Set<string>()
      },
      {
        key: "hydrosphere",
        event: "ui:goToHydrosphere",
        baseA: 0.45,
        hoverA: 0.85,
        colourHex: "#9a4dff",
        cells: [
          { row: 8, col: 10 }, { row: 9, col: 10 }, { row: 10, col: 10 }, { row: 11, col: 10 },
          { row: 8, col: 11 }, { row: 9, col: 11 }, { row: 10, col: 11 }, { row: 11, col: 11 },
          { row: 8, col: 12 }, { row: 9, col: 12 }, { row: 10, col: 12 }, { row: 11, col: 12 },
          { row: 8, col: 13 }, { row: 9, col: 13 }, { row: 10, col: 13 }, { row: 11, col: 13 },
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

    const tf = getTerraforming(this.scene);

    if (k === "atmosphere") {
      const strength01 = tf.ratio01("atmosphere");
      log("TerraformPlanet: applyEffect atmosphere");
      this.applyAtmosphere(strength01);
      return;
    }

    if (k === "magnetosphere") {
      const strength01 = tf.ratio01("magnetosphere");
      this.applyMagnetosphere(strength01);
      return;
    }

    if (k === "hydrosphere") {
      const water = tf.waterStep04(); //0..4
      this.run.waterLevel = water;
      this.applyHydrosphere(water);
      return;
    }
  }

  private disableEffect(k: Key) {
    if (k === "magnetosphere") {
      this.magnetosphereRenderer?.destroy();
      this.magnetosphereRenderer = undefined;
    }
  }

  private applyAtmosphere(strength01: number) {
    const s = Phaser.Math.Clamp(strength01, 0, 1);

    if (s <= 0) {
      this.atmosphereGlow?.clear();
      return;
    }

    if (!this.atmosphereGlow) {
      this.atmosphereGlow = this.scene.add.graphics();
      this.add(this.atmosphereGlow);
      this.atmosphereGlow.setBlendMode(Phaser.BlendModes.ADD);
    }

    drawAtmosphereGlow(this.atmosphereGlow, this.r, 0, s);
  }

  private applyMagnetosphere(strength01: number) {
    const s = Phaser.Math.Clamp(strength01, 0, 1);

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
        strengthOverride01: null
      });
    }

    this.magnetosphereRenderer.setStrength01(s);
  }

  private applyHydrosphere(waterLevel: number) {
    paintHydrosphere(this.gridData, this.run.hydroAlt, waterLevel);

    for (const g of this.hotspotGroups) {
      for (const cell of g.cells) {
        const a = (this.hoveredGroupKey === g.key) ? g.hoverA : g.baseA;
        this.gridData.setHex(cell.row, cell.col, g.colourHex, a);
      }
    }

    this.redrawTiles();
  }
}
