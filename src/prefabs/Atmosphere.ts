import Phaser from "phaser";
import PlanetEdge from "./PlanetEdge";

type AtmosphereConfig = {
  diameter: number;
  offsetRatio: number;

  count: number;
  arcStartDeg: number;
  arcEndDeg: number;

  radiusOffset: number;
};

export default class Atmosphere extends Phaser.GameObjects.Container {
  private diameter: number;
  private r: number;
  private offsetRatio: number;

  private atmoCount: number;
  private arcStartDeg: number;
  private arcEndDeg: number;
  private radiusOffset: number;

  private planetEdge!: PlanetEdge;
  private sprites: Phaser.GameObjects.Image[] = [];
  private deviceButtons: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: AtmosphereConfig) {
    super(scene, x, y);

    this.diameter = cfg.diameter;
    this.r = this.diameter / 2;
    this.offsetRatio = Phaser.Math.Clamp(cfg.offsetRatio, 0.25, 0.95);

    this.atmoCount = cfg.count;
    this.arcStartDeg = cfg.arcStartDeg;
    this.arcEndDeg = cfg.arcEndDeg;

    this.radiusOffset = cfg.radiusOffset;

    this.planetEdge = new PlanetEdge(scene, 0, 0, { diameter: this.diameter, capRatio: this.offsetRatio });
    this.add(this.planetEdge);

    this.rebuildSprites();
    this.createDeviceButtons(x);
  }

  private createDeviceButtons(x: number) {
    for (const b of this.deviceButtons) {
      b.destroy();
    }
    this.deviceButtons = [];

    const keys = ["atmosphereDevice1", "atmosphereDevice2", "atmosphereDevice3"];

    const diameter = 200;
    const radius = diameter / 2;
    const y = 240;

    const xPositions = [x - 360, x, x + 360];

    for (let i = 0; i < 3; i++) {
      const btn = this.makeCircleImageButton(xPositions[i] - this.x, y - this.y, radius, keys[i]);
      this.add(btn);
      this.deviceButtons.push(btn);
    }
  }

  private drawButtonGlow = (
    g: Phaser.GameObjects.Graphics,
    radius: number,
    color = 0x9fd6ff
  ) => {
    g.clear();

    const layers = 18;
    const inner = radius * 1.02;
    const outer = radius * 1.20;

    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1);
      const rad = Phaser.Math.Linear(inner, outer, t);
      const a = 0.22 * Math.pow(1 - t, 2.0);

      g.lineStyle(3, color, a);
      g.strokeCircle(0, 0, rad);
    }
  };

  private makeCircleImageButton(
    localX: number,
    localY: number,
    radius: number,
    imageKey: string
  ) {
    const btn = this.scene.add.container(localX, localY);

    const bg = this.scene.add.graphics();

    const draw = (strokeColor: number) => {
      bg.clear();
      bg.fillStyle(0x20202c, 1);
      bg.fillCircle(0, 0, radius);
      bg.lineStyle(6, strokeColor, 1);
      bg.strokeCircle(0, 0, radius);
    };

    draw(0x494949);

    const glow = this.scene.add.graphics();
    this.drawButtonGlow(glow, radius);

    const img = this.scene.add.image(0, 0, imageKey);

    const pad = 28;
    const max = radius * 2 - pad * 2;
    const scale = Math.min(max / img.width, max / img.height);
    img.setScale(scale);

    const diameter = radius * 2;
    const hit = this.scene.add.zone(0, 0, diameter, diameter).setOrigin(0.5, 0.5);
    hit.setInteractive(
      new Phaser.Geom.Circle(radius, radius, radius),
      Phaser.Geom.Circle.Contains
    );

    hit.on("pointerover", () => {
      this.scene.input.setDefaultCursor("pointer");
      draw(0x00ff00);
      btn.setScale(1.03);
    });

    hit.on("pointerout", () => {
      this.scene.input.setDefaultCursor("default");
      draw(0x9a9a9a);
      btn.setScale(1.0);
    });

    btn.add(glow);
    btn.add(bg);
    btn.add(img);
    btn.add(hit);

    return btn;
  }

  public rebuildSprites() {
    for (const s of this.sprites) {
      s.destroy();
    }
    this.sprites = [];

    const localCenterX = 0;
    const localCenterY = this.r * this.offsetRatio;

    const arcStart = Phaser.Math.DegToRad(this.arcStartDeg);
    const arcEnd = Phaser.Math.DegToRad(this.arcEndDeg);

    const radius = this.r + this.radiusOffset;

    for (let i = 0; i < this.atmoCount; i++) {
      const t = this.atmoCount === 1 ? 0.5 : i / (this.atmoCount - 1);
      const ang = Phaser.Math.Linear(arcStart, arcEnd, t);

      const x = localCenterX + Math.cos(ang) * radius;
      const y = localCenterY + Math.sin(ang) * radius;

      const img = this.scene.add.image(x, y, "atmosphereDevice1");
      img.setRotation(ang + Math.PI / 2);

      this.add(img);
      this.sprites.push(img);
    }
  }

  public setArc(arcStartDeg: number, arcEndDeg: number) {
    this.arcStartDeg = arcStartDeg;
    this.arcEndDeg = arcEndDeg;
    this.rebuildSprites();
  }

  public setCount(count: number) {
    this.atmoCount = Math.max(1, Math.floor(count));
    this.rebuildSprites();
  }
}
