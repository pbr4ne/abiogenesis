import Phaser from "phaser";
import PlanetBase from "../../planet/PlanetBase";
import { latForIndex, lonForIndex, makeRotator, pickCellByNearestProjectedCenter, Vec3 } from "../../planet/PlanetMath";
import MagnetosphereRenderer from "./MagnetosphereRenderer";
import { drawAtmosphereGlow } from "./AtmosphereRenderer";
import PlanetRunState from "../../planet/PlanetRunState";
import { paintHydrosphere } from "./HydrosphereMap";
import { getTerraforming } from "./getTerraformingState";
import { strokeProjectedSphereCircle, clamp, dot3 } from "./CircleProjection";
import CoreExplosions from "./CoreExplosions";
import { checkUrlParam } from "../../utilities/GameUtils";
import { getRun } from "../../utilities/GameSession";

type Key = "atmosphere" | "magnetosphere" | "hydrosphere" | "core";

type HotspotGroup = {
  key: Key;
  event: string;
  baseA: number;
  hoverA: number;
  fillA: number;
  colourHex: string;
  centerUnit: Vec3;
  angRad: number;
};

export default class TerraformingPlanet extends PlanetBase {
  private run: PlanetRunState;

  private enabledEffects: Required<Record<Key, boolean>>;
  private enabledHotspots: Required<Record<Key, boolean>>;
  private hotspotOutline?: Phaser.GameObjects.Graphics;

  private hotspotGroups: HotspotGroup[] = [];

  private hoveredGroupKey: Key | null = null;
  private hotspotRotate?: ReturnType<typeof makeRotator>;

  private getHotspotRotate() {
    return this.hotspotRotate ?? this.rotate;
  }

  private magnetosphereRenderer?: MagnetosphereRenderer;
  private atmosphereGlow?: Phaser.GameObjects.Graphics;

  private coreFx?: CoreExplosions;

  constructor(scene: Phaser.Scene, x = 960, y = 540) {
    super(scene, x, y);

    this.hotspotRotate = this.rotate;

    this.run = getRun();
    const tf = getTerraforming(scene);

    this.enabledEffects = { atmosphere: true, magnetosphere: true, hydrosphere: true, core: true };
    this.enabledHotspots = { atmosphere: true, magnetosphere: true, hydrosphere: true, core: true };

    this.buildHotspots();
    this.wireHotspotInput();

    const onChange = (k: "atmosphere" | "magnetosphere" | "hydrosphere" | "core") => this.applyEffect(k);
    tf.on("change", onChange);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      tf.off("change", onChange);
      this.magnetosphereRenderer?.destroy();
      this.magnetosphereRenderer = undefined;
      this.coreFx?.destroy();
      this.coreFx = undefined;
    });

    this.applyAllEffects();
  }

  private buildHotspots() {
    const div = this.divisions;

    const cellCenterUnit = (row: number, col: number): Vec3 => {
      const lat0 = latForIndex(row, div);
      const lat1 = latForIndex(row + 1, div);
      const lon0 = lonForIndex(col, div);
      const lon1 = lonForIndex(col + 1, div);

      const lat = (lat0 + lat1) * 0.5;
      const lon = (lon0 + lon1) * 0.5;

      return {
        x: Math.cos(lat) * Math.sin(lon),
        y: Math.sin(lat),
        z: Math.cos(lat) * Math.cos(lon)
      };
    };

    const coreCell = { row: 15, col: 17 };
    const coreCenter = cellCenterUnit(coreCell.row, coreCell.col);

    const hydroCell = { row: 25, col: 25 }
    const hydroCenter = cellCenterUnit(hydroCell.row, hydroCell.col);

    const magCell = { row: 18, col: 9 };
    const magCenter = cellCenterUnit(magCell.row, magCell.col);

    const atmoCell = { row: 0, col: 0 };
    const atmoCenter = cellCenterUnit(atmoCell.row, atmoCell.col);

    const cellAng = Math.PI / div;

    const allGroups: HotspotGroup[] = [
      {
        key: "atmosphere",
        event: "ui:goToAtmosphere",
        baseA: 0.85,
        hoverA: 1,
        fillA: 0.18,
        colourHex: "#ff00ff",
        centerUnit: atmoCenter,
        angRad: cellAng * 4
      },
      {
        key: "magnetosphere",
        event: "ui:goToMagnetosphere",
        baseA: 0.85,
        hoverA: 1,
        fillA: 0.18,
        colourHex: "#ff0000",
        centerUnit: magCenter,
        angRad: cellAng * 5
      },
      {
        key: "hydrosphere",
        event: "ui:goToHydrosphere",
        baseA: 0.85,
        hoverA: 1,
        fillA: 0.18,
        colourHex: "#09b674",
        centerUnit: hydroCenter,
        angRad: cellAng * 5
      },
      {
        key: "core",
        event: "ui:goToCore",
        baseA: 0.85,
        hoverA: 1,
        fillA: 0.18,
        colourHex: "#ffd35a",
        centerUnit: coreCenter,
        angRad: cellAng * 4
      }
    ];

    this.hotspotGroups = allGroups.filter(g => this.enabledHotspots[g.key]);

    if (!this.hotspotOutline) {
      this.hotspotOutline = this.scene.add.graphics();
      this.add(this.hotspotOutline);
    }

    this.redrawHotspotOutlines();
  }

  private wireHotspotInput() {
    this.scene.events.on(Phaser.Scenes.Events.WAKE, this.clearHotspotHover, this);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.events.off(Phaser.Scenes.Events.WAKE, this.clearHotspotHover, this);
    });

    this.hitZone.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      const dx = pointer.worldX - this.x;
      const dy = pointer.worldY - this.y;

      const cell = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.getHotspotRotate());

      let nextKey: Key | null = null;

      if (cell) {
        const u = (() => {
          const lat0 = latForIndex(cell.row, this.divisions);
          const lat1 = latForIndex(cell.row + 1, this.divisions);
          const lon0 = lonForIndex(cell.col, this.divisions);
          const lon1 = lonForIndex(cell.col + 1, this.divisions);

          const lat = (lat0 + lat1) * 0.5;
          const lon = (lon0 + lon1) * 0.5;

          return {
            x: Math.cos(lat) * Math.sin(lon),
            y: Math.sin(lat),
            z: Math.cos(lat) * Math.cos(lon)
          };
        })();

        for (const g of this.hotspotGroups) {
          const ang = Math.acos(clamp(dot3(g.centerUnit, u), -1, 1));
          if (ang <= g.angRad) {
            nextKey = g.key;
            break;
          }
        }
      }

      if (nextKey === this.hoveredGroupKey) return;

      this.hoveredGroupKey = nextKey;

      if (nextKey !== null) this.scene.input.setDefaultCursor("pointer");
      else this.scene.input.setDefaultCursor("default");

      this.redrawHotspotOutlines();
    });

    this.hitZone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const dx = pointer.worldX - this.x;
      const dy = pointer.worldY - this.y;

      const cell = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.getHotspotRotate());
      if (!cell) return;

      const u = (() => {
        const lat0 = latForIndex(cell.row, this.divisions);
        const lat1 = latForIndex(cell.row + 1, this.divisions);
        const lon0 = lonForIndex(cell.col, this.divisions);
        const lon1 = lonForIndex(cell.col + 1, this.divisions);

        const lat = (lat0 + lat1) * 0.5;
        const lon = (lon0 + lon1) * 0.5;

        return {
          x: Math.cos(lat) * Math.sin(lon),
          y: Math.sin(lat),
          z: Math.cos(lat) * Math.cos(lon)
        };
      })();

      for (const g of this.hotspotGroups) {
        const ang = Math.acos(clamp(dot3(g.centerUnit, u), -1, 1));
        if (ang <= g.angRad) {
          this.clearHotspotHover();
          this.scene.events.emit(g.event);
          return;
        }
      }
    });

    this.hitZone.on("pointerout", () => {
      this.clearHotspotHover();
    });

    this.hitZone.on("pointerupoutside", () => {
      this.clearHotspotHover();
    });
  }

  private clearHotspotHover() {
    if (!this.hotspotGroups?.length) return;

    this.hoveredGroupKey = null;
    this.redrawHotspotOutlines();
    this.scene.input.setDefaultCursor("default");
  }

  private applyAllEffects() {
    this.applyEffect("atmosphere");
    this.applyEffect("magnetosphere");
    this.applyEffect("hydrosphere");
    this.applyEffect("core");
  }

  private applyEffect(k: "atmosphere" | "magnetosphere" | "hydrosphere" | "core") {
    if (!this.enabledEffects[k]) {
      this.disableEffect(k);
      return;
    }

    const tf = getTerraforming(this.scene);

    if (k === "atmosphere") {
      let atmosphereLevel = tf.ratio01("atmosphere");
      if (checkUrlParam("overrideAll", "true")) {
        atmosphereLevel = 1;
      }
      this.applyAtmosphere(atmosphereLevel);
      return;
    }

    if (k === "magnetosphere") {
      let magnetosphereLevel = tf.ratio01("magnetosphere");
      if (checkUrlParam("overrideAll", "true")) {
        magnetosphereLevel = 1;
      }
      this.applyMagnetosphere(magnetosphereLevel);
      return;
    }

    if (k === "hydrosphere") {
      let waterLevel = tf.waterStep10();
      if (checkUrlParam("overrideAll", "true")) {
        waterLevel = 10;
      }
      this.run.waterLevel = waterLevel;
      this.applyHydrosphere(waterLevel);
      return;
    }

    if (k === "core") {
      let coreLevel = tf.ratio01("core");
      if (checkUrlParam("overrideAll", "true")) {
        coreLevel = 1;
      }
      this.applyCore(coreLevel);
      return;
    }
  }

  private applyCore(strength01: number) {
    const s = Phaser.Math.Clamp(strength01, 0, 1);

    if (!this.coreFx) {
      this.coreFx = new CoreExplosions(this.scene, {
        parent: this,
        getRotate: () => this.getHotspotRotate(),
        getR: () => this.r,
        getDivisions: () => this.divisions,
        delayMs: 250
      });
    }

    this.coreFx.setStrength01(s);
  }

  private redrawHotspotOutlines() {
    if (!this.hotspotOutline) return;

    const g = this.hotspotOutline;
    g.clear();

    const rotate = this.getHotspotRotate();

    for (const group of this.hotspotGroups) {
      const hovered = this.hoveredGroupKey === group.key;
      const a = hovered ? group.hoverA : group.baseA;
      const hex = Phaser.Display.Color.HexStringToColor(group.colourHex).color;

      if (hovered && group.fillA > 0) {
        const steps = 8;
        for (let i = 0; i < steps; i++) {
          const t = 1 - i / steps;
          const ang = group.angRad * t;
          const fillAlpha = group.fillA * (t * t);

          strokeProjectedSphereCircle(
            g,
            this.r,
            group.centerUnit,
            ang,
            rotate,
            18,
            hex,
            fillAlpha,
            96
          );
        }
      }

      strokeProjectedSphereCircle(
        g,
        this.r,
        group.centerUnit,
        group.angRad,
        rotate,
        6,
        hex,
        a,
        96
      );
    }
  }

  protected onAfterTilesRedraw() {
    this.redrawHotspotOutlines();
  }

  private disableEffect(k: "magnetosphere" | "atmosphere" | "hydrosphere" | "core") {
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

        loopCenterOffsetMulMin: 0.95,
        loopCenterOffsetMulMax: 1.05,

        innerRadiusMulMin: 0.12,
        innerRadiusMulMax: 0.16,

        outerRadiusMulMin: 1.10,
        outerRadiusMulMax: 1.45,

        strengthOverride01: null
      });
    }

    this.magnetosphereRenderer.setStrength01(s);
  }

  private applyHydrosphere(waterLevel: number) {
    paintHydrosphere(this.gridData, this.run.hydroAlt, waterLevel);
    this.redrawTiles();
    this.redrawHotspotOutlines();
  }
}
