import Phaser from "phaser";
import PhaseScene from "../../scenes/PhaseScene";
import { log } from "../../utilities/GameUtils";

type PlanetDef = {
  id: string;
  r: number;
  orbitT?: number;
};

export default class GalaxyMap extends PhaseScene {
  private bgG!: Phaser.GameObjects.Graphics;
  private planetG!: Phaser.GameObjects.Graphics;

  private planets: {
    def: PlanetDef;
    x: number;
    y: number;
  }[] = [];

  constructor() {
    super("GalaxyMap");
  }

  protected createPhase() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.bgG = this.add.graphics();
    this.bgG.setScrollFactor(0);

    this.planetG = this.add.graphics();
    this.planetG.setScrollFactor(0);

    this.drawGalaxyBackground(w, h);

    const defs: PlanetDef[] = [
      { id: "p1", r: 22 },
      { id: "p2", r: 36 },
      { id: "p3", r: 18 },
      { id: "p4", r: 48 },
      { id: "p5", r: 28 },
      { id: "p6", r: 60 },
      { id: "p7", r: 20 },
      { id: "p8", r: 40 },
      { id: "p9", r: 26 },
      { id: "p10", r: 54 },
    ];

    this.planets = this.placePlanetsHardcoded(defs, w, h);

    this.drawPlanets();

    this.enablePlanetInput();
  }

  private drawGalaxyBackground(w: number, h: number) {
    const g = this.bgG;
    g.clear();

    g.fillStyle(0x05060a, 1);
    g.fillRect(0, 0, w, h);

    const cx = w * 0.52;
    const cy = h * 0.48;

    const arms = 3;
    const dotsPerArm = 1800;

    for (let arm = 0; arm < arms; arm++) {
      const armPhase = (arm / arms) * Math.PI * 2;

      for (let i = 0; i < dotsPerArm; i++) {
        const t = i / (dotsPerArm - 1);

        const rad = Phaser.Math.Linear(2, Math.min(w, h) * 0.95, t);

        const ang = armPhase + t * 3.6 * Math.PI;

        const armWidth = Phaser.Math.Linear(6, 120, t);
        const jitter = Phaser.Math.FloatBetween(-armWidth, armWidth);
        const j2 = Phaser.Math.FloatBetween(-armWidth * 0.7, armWidth * 0.7);

        const x = cx + Math.cos(ang) * (rad + jitter);
        const y = cy + Math.sin(ang) * (rad * 0.85 + j2);

        if (x < -120 || x > w + 120 || y < -120 || y > h + 120) continue;

        const coreBoost = Phaser.Math.Linear(1.9, 1.0, t);
        const a =
          Phaser.Math.Linear(0.22, 0.04, t) *
          coreBoost *
          Phaser.Math.FloatBetween(0.6, 1.0);

        const size = Phaser.Math.FloatBetween(0.9, 2.8) * coreBoost;

        g.fillStyle(0xcfe1ff, a);
        g.fillCircle(x, y, size);
      }
    }

    for (let i = 0; i < 1200; i++) {
      const t = Math.random();
      const r = Math.min(w, h) * 0.14 * t * t;

      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);

      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * (r * 0.85);

      const coreBoost = Phaser.Math.Linear(2.2, 1.0, t);

      const alpha = Phaser.Math.FloatBetween(0.06, 0.16) * coreBoost;
      const size = Phaser.Math.FloatBetween(1.6, 3.4) * coreBoost;

      g.fillStyle(0xe9f0ff, alpha);
      g.fillCircle(x, y, size);
    }

    const starCount = 450;
    for (let i = 0; i < starCount; i++) {
      const x = Phaser.Math.FloatBetween(0, w);
      const y = Phaser.Math.FloatBetween(0, h);
      const size = Phaser.Math.FloatBetween(0.6, 2.2);
      const a = Phaser.Math.FloatBetween(0.15, 0.9);

      const warm = Math.random() < 0.12;
      g.fillStyle(warm ? 0xfff2cf : 0xf7fbff, a);
      g.fillCircle(x, y, size);
    }
  }

  private placePlanetsHardcoded(defs: PlanetDef[], w: number, h: number) {
    const slots = [
      { nx: 0.18, ny: 0.28 },
      { nx: 0.34, ny: 0.18 },
      { nx: 0.46, ny: 0.33 },
      { nx: 0.63, ny: 0.22 },
      { nx: 0.78, ny: 0.34 },

      { nx: 0.22, ny: 0.62 },
      { nx: 0.40, ny: 0.52 },
      { nx: 0.58, ny: 0.68 },
      { nx: 0.70, ny: 0.54 },
      { nx: 0.86, ny: 0.62 },
    ];

    const pad = 18;

    return defs.map((def, i) => {
      const s = slots[i];
      const x = Phaser.Math.Clamp(s.nx * w, pad + def.r, w - pad - def.r);
      const y = Phaser.Math.Clamp(s.ny * h, pad + def.r, h - pad - def.r);
      return { def, x, y };
    });
  }

  private drawPlanets() {
    const g = this.planetG;
    g.clear();

    for (let i = 0; i < this.planets.length; i++) {
      const p = this.planets[i];
      const { x, y } = p;
      const base = this.rainbowColor(i, this.planets.length);

      g.fillStyle(0x000000, 0.22);
      g.fillCircle(x + p.def.r * 0.12, y + p.def.r * 0.12, p.def.r * 1.03);

      g.fillStyle(this.darkenColor(base, 0.65), 0.95);
      g.fillCircle(x, y, p.def.r);

      g.fillStyle(0xffffff, 0.10);
      g.fillCircle(x - p.def.r * 0.22, y - p.def.r * 0.18, p.def.r * 0.78);

      g.lineStyle(Math.max(2, Math.floor(p.def.r * 0.08)), 0xffffff, 0.10);
      g.strokeCircle(x, y, p.def.r);

      if (p.def.r >= 40 && Math.random() < 0.6) {

        const rx = p.def.r * 1.35;
        const ry = p.def.r * 0.45;
        const ringY = y + p.def.r * 0.12;

        g.lineStyle(4, 0xffffff, 0.18);
        this.strokeEllipseArc(g, x, ringY, rx, ry, Math.PI, Math.PI * 2, 44);

        g.fillStyle(0x000000, 0.22);
        g.fillCircle(x + p.def.r * 0.12, y + p.def.r * 0.12, p.def.r * 1.03);

        g.fillStyle(this.darkenColor(base, 0.65), 0.95);

        g.fillCircle(x, y, p.def.r);

        g.fillStyle(0xffffff, 0.10);
        g.fillCircle(x - p.def.r * 0.22, y - p.def.r * 0.18, p.def.r * 0.78);

        g.lineStyle(Math.max(2, Math.floor(p.def.r * 0.08)), 0xffffff, 0.10);
        g.strokeCircle(x, y, p.def.r);

        g.lineStyle(4, 0xffffff, 0.40);
        this.strokeEllipseArc(g, x, ringY, rx, ry, 0, Math.PI, 44);
      }
    }
  }

  private darkenColor(col: number, mul: number) {
    const c = Phaser.Display.Color.IntegerToColor(col);
    return Phaser.Display.Color.GetColor(
      Math.floor(c.red * mul),
      Math.floor(c.green * mul),
      Math.floor(c.blue * mul)
    );
  }

  private rainbowColor(i: number, n: number) {
    const h = (i / Math.max(1, n)) * 360;
    const c = Phaser.Display.Color.HSVToRGB(h / 360, 0.55, 1.0) as Phaser.Types.Display.ColorObject;
    return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
  }

  private enablePlanetInput() {
    const hoverG = this.add.graphics();
    hoverG.setScrollFactor(0);

    for (const p of this.planets) {
      const zone = this.add.zone(p.x, p.y, p.def.r * 2.2, p.def.r * 2.2);
      zone.setScrollFactor(0);

      const hit = new Phaser.Geom.Circle(p.x, p.y, p.def.r);
      zone.setInteractive(hit, Phaser.Geom.Circle.Contains);

      zone.on("pointerover", () => {
        hoverG.clear();
        hoverG.lineStyle(3, 0xffffff, 0.35);
        hoverG.strokeCircle(p.x, p.y, p.def.r + 6);
      });

      zone.on("pointerout", () => {
        hoverG.clear();
      });

      zone.on("pointerdown", () => {
        log("Clicked planet: " + p.def.id);
      });
    }

    this.scale.on("resize", () => hoverG.clear());
  }


  private strokeEllipseArc(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    startRad: number,
    endRad: number,
    steps: number
  ) {
    if (steps < 2) steps = 2;

    g.beginPath();

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = startRad + (endRad - startRad) * t;

      const x = cx + Math.cos(a) * rx;
      const y = cy + Math.sin(a) * ry;

      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }

    g.strokePath();
  }
}
