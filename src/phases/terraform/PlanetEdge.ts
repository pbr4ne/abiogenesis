import Phaser from "phaser";
import PlanetBase from "../../planet/PlanetBase";
import PlanetRunState from "../../planet/PlanetRunState";
import { drawAtmosphereGlow } from "./AtmosphereRenderer";
import { paintHydrosphere } from "./HydrosphereMap";
import { getTerraforming } from "./getTerraformingState";
import { checkUrlParam } from "../../utilities/GameUtils";
import MagnetosphereRenderer from "./MagnetosphereRenderer";

type PlanetEdgeConfig = {
  diameter?: number;
  capRatio?: number;

  run: PlanetRunState;

  divisions?: number;
  tiltDeg?: number;
  yawDeg?: number;
};

class PlanetCapPlanet extends PlanetBase {
  private magField?: MagnetosphereRenderer;

  constructor(scene: Phaser.Scene, diameter: number, cfg: PlanetEdgeConfig) {
    super(scene, 0, 0, {
      diameter,
      divisions: cfg.divisions ?? 40,
      tiltDeg: 0,
      yawDeg: 0,

      wireEvery: 160,
      wireWidth: 3,
      wireAlpha: 0.35
    });

    this.stopSmoothRotation();
    this.hitZone.disableInteractive();
  }

  public applyHydrosphere(run: PlanetRunState, waterLevel: number) {
    paintHydrosphere(this.getGridData(), run.hydroAlt, waterLevel);
    this.redrawTiles();
  }

  public applyMagnetosphere(strength01: number) {
    const s = Phaser.Math.Clamp(strength01, 0, 1);

    if (!this.magField) {
      this.magField = new MagnetosphereRenderer(this.scene, this.behind, {
        r: this.diameter / 2,
        centerX: 0,
        centerY: 0,

        lineAlpha: 0.18,
        lineWidth: 2,
        perSideLines: 6,

        loopCenterOffsetMul: 1,
        innerRadiusMul: 0.15,
        outerRadiusMul: 1.35,

        loopCenterOffsetMulMin: 0.85,
        loopCenterOffsetMulMax: 1,

        innerRadiusMulMin: 0.12,
        innerRadiusMulMax: 0.18,

        outerRadiusMulMin: 1.15,
        outerRadiusMulMax: 1.75,

        strengthOverride01: null
      });

      (this.behind as any).list?.[this.behind.length - 1]?.setBlendMode?.(Phaser.BlendModes.ADD);
    }

    this.magField.setStrength01(s);
  }

  public override destroy(fromScene?: boolean) {
    this.magField?.destroy();
    this.magField = undefined;
    super.destroy(fromScene);
  }
}

export default class PlanetEdge extends Phaser.GameObjects.Container {
  private diameter: number;
  private r: number;
  private capRatio: number;

  private run: PlanetRunState;

  private planet!: PlanetCapPlanet;
  private glow!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x = 0, y = 0, cfg: PlanetEdgeConfig) {
    super(scene, x, y);

    this.diameter = cfg.diameter ?? 1100;
    this.r = this.diameter / 2;
    this.capRatio = Phaser.Math.Clamp(cfg.capRatio ?? 0.60, 0.25, 0.95);

    this.run = cfg.run;

    const centerY = this.r * this.capRatio;

    this.planet = new PlanetCapPlanet(scene, this.diameter, cfg);
    this.planet.setPosition(0, centerY);
    this.add(this.planet);

    this.glow = scene.add.graphics();
    this.glow.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.glow);

    const tf = getTerraforming(scene);

    const apply = () => {
      let water = tf.waterStep10();
      if (checkUrlParam("overrideAll", "true")) water = 10;
      this.run.waterLevel = water;
      this.planet.applyHydrosphere(this.run, water);

      let mag = tf.ratio01("magnetosphere");
      if (checkUrlParam("overrideAll", "true")) mag = 1;
      this.planet.applyMagnetosphere(mag);

      let atmo = tf.ratio01("atmosphere");
      if (checkUrlParam("overrideAll", "true")) atmo = 1;
      drawAtmosphereGlow(this.glow, this.r, centerY, atmo);
    };

    apply();

    const onChange = (k: "atmosphere" | "magnetosphere" | "hydrosphere" | "core") => {
      if (k !== "hydrosphere" && k !== "atmosphere" && k !== "magnetosphere") return;
      apply();
    };

    tf.on("change", onChange);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      tf.off("change", onChange);
      this.planet.clearMask(true);
      this.glow.destroy();
      this.planet.destroy();
    });

    scene.add.existing(this);
  }
}
