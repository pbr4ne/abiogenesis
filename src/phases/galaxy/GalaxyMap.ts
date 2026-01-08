import Phaser from "phaser";
import { GalaxyMemory } from "../../utilities/GalaxyMemory";
import PhaseScene from "../../scenes/PhaseScene";
import { log } from "../../utilities/GameUtils";
import { LifeFormType } from "../evolution/EvolutionTypes";
import { LIFEFORMS } from "../evolution/LifeForms";
import { resetRun } from "../../utilities/GameSession";

type PlanetDef = {
  id: string;
  r: number;
  orbitT?: number;
};

export default class GalaxyMap extends PhaseScene {
  private planetG!: Phaser.GameObjects.Graphics;
  private lfPlanetId: string | null = null;
  private lfMarker?: Phaser.GameObjects.GameObject;
  private lfType: LifeFormType = "prokaryote";
  private completedMarkers: Phaser.GameObjects.Image[] = [];

  private planets: {
    def: PlanetDef;
    x: number;
    y: number;
  }[] = [];

  constructor() {
    super("GalaxyMap");
  }

  public init(data: any) {
    const t = data?.lfType as LifeFormType | undefined;
    if (t && (t in LIFEFORMS)) this.lfType = t;
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
      { id: "p1", r: 30 },
      { id: "p2", r: 40 },
      { id: "p3", r: 28 },
      { id: "p4", r: 52 },
      { id: "p5", r: 34 },
      { id: "p6", r: 64 },
      { id: "p7", r: 30 },
      { id: "p8", r: 46 },
      { id: "p9", r: 32 },
      { id: "p10", r: 56 },
    ];

    this.planets = this.placePlanetsHardcoded(defs, w, h);

    this.pickLfPlanet();
    this.drawPlanets();
    this.renderCompletedPlanetMarkers();
    this.renderLfPlanetMarker();
    this.enablePlanetInput();
  }

  private pickLfPlanet() {
    const allIds = this.planets.map(p => p.def.id);

    const pending = GalaxyMemory.pendingPlanetId;

    let targetId: string;

    if (pending && GalaxyMemory.completed[pending] == null) {
      targetId = pending;
    } else {
      const available = allIds.filter(id => GalaxyMemory.completed[id] == null);

      if (available.length === 0) {
        this.scene.start("EndGame");
        return;
      }

      targetId = Phaser.Utils.Array.GetRandom(available);
    }

    this.lfPlanetId = targetId;

    GalaxyMemory.completed[targetId] = this.lfType;

    GalaxyMemory.pendingPlanetId = null;

    if (allIds.every(id => GalaxyMemory.completed[id] != null)) {
      this.scene.start("EndGame");
    }
  }

  private renderLfPlanetMarker() {
    if (!this.lfPlanetId) return;

    const p = this.planets.find(pp => pp.def.id === this.lfPlanetId);
    if (!p) return;

    this.lfMarker?.destroy();

    const lfDef = LIFEFORMS[this.lfType];
    if (!lfDef) return;

    const iconKey = lfDef.type;

    log(iconKey);
    const img = this.add.image(p.x, p.y, iconKey);
    img.setScrollFactor(0);
    img.setDepth(10);
    this.bgCam.ignore(img);

    const size = Math.max(16, Math.floor(p.def.r * 1.15));
    img.setDisplaySize(size, size);

    this.lfMarker = img;
  }

  private planetBaseColor(i: number) {
    const palette = [
      0x2f6bff,
      0xff2fb3,
      0x29ff7a,
      0xffc52a,
      0xa62fff,
      0x00e5ff,
      0xff3b30,
      0xbfff2a,
      0x2ad7ff,
      0xff7a1a
    ];

    return palette[i % palette.length];
  }

  private placePlanetsHardcoded(defs: PlanetDef[], w: number, h: number) {
    const slots = [
      { nx: 0.18, ny: 0.33 },
      { nx: 0.34, ny: 0.23 },
      { nx: 0.46, ny: 0.38 },
      { nx: 0.63, ny: 0.27 },
      { nx: 0.78, ny: 0.39 },

      { nx: 0.22, ny: 0.67 },
      { nx: 0.40, ny: 0.57 },
      { nx: 0.58, ny: 0.73 },
      { nx: 0.70, ny: 0.59 },
      { nx: 0.86, ny: 0.67 },
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

      const completedType = GalaxyMemory.completed[p.def.id] as LifeFormType | undefined;

      const baseCol = completedType
        ? Phaser.Display.Color.GetColor(
          LIFEFORMS[completedType].colour.r,
          LIFEFORMS[completedType].colour.g,
          LIFEFORMS[completedType].colour.b
        )
        : this.planetBaseColor(i);

      const { x, y } = p;

      g.fillStyle(0x000000, 0.22);
      g.fillCircle(x + p.def.r * 0.12, y + p.def.r * 0.12, p.def.r * 1.03);

      g.fillStyle(this.darkenColor(baseCol, 0.65), 0.95);
      g.fillCircle(x, y, p.def.r);

      g.fillStyle(0xffffff, 0.10);
      g.fillCircle(x - p.def.r * 0.22, y - p.def.r * 0.18, p.def.r * 0.78);

      g.lineStyle(Math.max(2, Math.floor(p.def.r * 0.08)), 0xffffff, 0.10);
      g.strokeCircle(x, y, p.def.r);

      if (p.def.id === this.lfPlanetId) {
        g.lineStyle(Math.max(4, Math.floor(p.def.r * 0.11)), 0x00ffff, 0.28);
        g.strokeCircle(x, y, p.def.r + 7);

        g.lineStyle(Math.max(2, Math.floor(p.def.r * 0.06)), 0x00ffff, 0.18);
        g.strokeCircle(x, y, p.def.r + 12);
      }

      if (p.def.r >= 40 && Math.random() < 0.6) {

        const rx = p.def.r * 1.35;
        const ry = p.def.r * 0.45;
        const ringY = y + p.def.r * 0.12;

        g.lineStyle(4, 0xffffff, 0.18);
        this.strokeEllipseArc(g, x, ringY, rx, ry, Math.PI, Math.PI * 2, 44);

        g.fillStyle(0x000000, 0.22);
        g.fillCircle(x + p.def.r * 0.12, y + p.def.r * 0.12, p.def.r * 1.03);

        g.fillStyle(this.darkenColor(baseCol, 0.65), 0.95);

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

  private enablePlanetInput() {
    const hoverG = this.add.graphics();
    hoverG.setScrollFactor(0);
    this.bgCam.ignore(hoverG);

    for (const p of this.planets) {

      const locked = GalaxyMemory.completed[p.def.id] != null;

      const hitCircle = this.add.circle(p.x, p.y, p.def.r, 0xffffff, 0.001);
      hitCircle.setScrollFactor(0);
      this.bgCam.ignore(hitCircle);

      if (locked) {
        hitCircle.disableInteractive();
        continue;
      }

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
        GalaxyMemory.pendingPlanetId = p.def.id;

        resetRun();

        this.scene.start("Terraforming");

      });
    }

    const onResize = () => hoverG.clear();
    this.scale.on("resize", onResize);
    this.onShutdown(() => this.scale.off("resize", onResize));
  }

  private renderCompletedPlanetMarkers() {
    for (const m of this.completedMarkers) m.destroy();
    this.completedMarkers = [];

    for (const p of this.planets) {
      const lfType = GalaxyMemory.completed[p.def.id];
      if (!lfType) continue;

      const img = this.add.image(p.x, p.y, lfType);
      img.setScrollFactor(0);
      img.setDepth(10);
      this.bgCam.ignore(img);

      const size = Math.max(16, Math.floor(p.def.r * 1.15));
      img.setDisplaySize(size, size);

      this.completedMarkers.push(img);
    }
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
