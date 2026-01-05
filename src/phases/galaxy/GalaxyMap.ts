import Phaser from "phaser";
import PhaseScene from "../../scenes/PhaseScene";
import { log } from "../../utilities/GameUtils";

type PlanetDef = {
  id: string;
  r: number;
  orbitT?: number;
};

export default class GalaxyMap extends PhaseScene {
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
    const w = 1920;
    const h = 1080;

    const bg = this.add.image(w / 2, h / 2, "galaxy");
    bg.setScrollFactor(0);
    bg.setDepth(-10000);

    this.bgCam.ignore(bg);

    this.planetG = this.add.graphics();
    this.planetG.setScrollFactor(0);
    this.planetG.setDepth(0);

    this.bgCam.ignore(this.planetG);

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
    this.bgCam.ignore(hoverG);

    for (const p of this.planets) {
      const hitCircle = this.add.circle(p.x, p.y, p.def.r, 0xffffff, 0.001);
      hitCircle.setScrollFactor(0);
      this.bgCam.ignore(hitCircle);

      hitCircle.setInteractive({ useHandCursor: true });

      hitCircle.on(Phaser.Input.Events.POINTER_OVER, () => {
        hoverG.clear();
        hoverG.lineStyle(3, 0xffffff, 0.35);
        hoverG.strokeCircle(p.x, p.y, p.def.r + 6);
      });

      hitCircle.on(Phaser.Input.Events.POINTER_OUT, () => {
        hoverG.clear();
      });

      hitCircle.on(Phaser.Input.Events.POINTER_DOWN, () => {
        log("Clicked planet: " + p.def.id);
        this.scene.start("Terraforming");
      });
    }

    const onResize = () => hoverG.clear();
    this.scale.on("resize", onResize);
    this.onShutdown(() => this.scale.off("resize", onResize));
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
