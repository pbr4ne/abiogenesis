import Phaser from "phaser";
import PhaseScene from "../scenes/PhaseScene";
import { LifeFormType } from "../phases/evolution/EvolutionTypes";
import { LIFEFORMS } from "../phases/evolution/LifeForms";
import { Audio } from "../utilities/GameSounds";

type EndPlanet = {
  x: number;
  y: number;
  r: number;
  col: number;
  lfType: LifeFormType;
};

export default class EndGame extends PhaseScene {
  private planets: EndPlanet[] = [];
  private planetObjs: Phaser.GameObjects.Container[] = [];
  private infinity?: Phaser.GameObjects.Image;

  constructor() {
    super("EndGame");
  }

  protected createPhase() {
    Audio.init(this.sys.game);
    Audio.playMusic("galaxy_music", { loop: true });
    Audio.playSfx("Game Complete");
    this.onShutdown(() => Audio.stopMusicIfKey("galaxy_music"));

    const w = 1920;
    const h = 1080;

    const bg = this.add.image(w / 2, h / 2, "galaxy");
    bg.setScrollFactor(0);
    bg.setDepth(-10000);
    this.bgCam.ignore(bg);

    this.planets = this.makePlanets(w, h);
    this.renderPlanets();
    this.playSequence(w, h);
  }

  private makePlanets(w: number, h: number) {
    const allTypes = Object.keys(LIFEFORMS) as LifeFormType[];
    const targetCount = Phaser.Math.Clamp(60 + allTypes.length * 3, 60, 90);
    const pad = 18;

    const placed: EndPlanet[] = [];

    const tryPlace = (r: number) => {
      for (let attempt = 0; attempt < 2600; attempt++) {
        const x = Phaser.Math.Between(pad + r, w - pad - r);
        const y = Phaser.Math.Between(pad + r, h - pad - r);

        let ok = true;
        for (const p of placed) {
          const dx = p.x - x;
          const dy = p.y - y;
          const rr = p.r + r + 10;
          if (dx * dx + dy * dy < rr * rr) {
            ok = false;
            break;
          }
        }

        if (ok) return { x, y };
      }
      return null;
    };

    for (let i = 0; i < targetCount; i++) {
      const lfType = Phaser.Utils.Array.GetRandom(allTypes);
      const def = LIFEFORMS[lfType];
      const baseCol = Phaser.Display.Color.GetColor(def.colour.r, def.colour.g, def.colour.b);
      const r = Phaser.Math.Between(14, 54);

      const pos = tryPlace(r);
      if (!pos) continue;

      placed.push({ x: pos.x, y: pos.y, r, col: baseCol, lfType });
    }

    return placed;
  }

  private renderPlanets() {
    for (const o of this.planetObjs) o.destroy();
    this.planetObjs = [];

    for (const p of this.planets) {
      const c = this.add.container(p.x, p.y);
      c.setScrollFactor(0);
      c.setDepth(0);
      c.setAlpha(0);
      c.setScale(0.85);

      const g = this.add.graphics();
      g.setScrollFactor(0);

      g.fillStyle(0x000000, 0.22);
      g.fillCircle(p.r * 0.12, p.r * 0.12, p.r * 1.03);

      g.fillStyle(this.darkenColor(p.col, 0.62), 0.95);
      g.fillCircle(0, 0, p.r);

      g.fillStyle(0xffffff, 0.10);
      g.fillCircle(-p.r * 0.22, -p.r * 0.18, p.r * 0.78);

      g.lineStyle(Math.max(2, Math.floor(p.r * 0.08)), 0xffffff, 0.10);
      g.strokeCircle(0, 0, p.r);

      c.add(g);

      const iconKey = p.lfType;
      if (this.textures.exists(iconKey)) {
        const img = this.add.image(0, 0, iconKey);
        img.setDisplaySize(
          Math.max(12, Math.floor(p.r * 1.05)),
          Math.max(12, Math.floor(p.r * 1.05))
        );
        c.add(img);
        this.bgCam.ignore(img);
      }

      this.bgCam.ignore(g);
      this.bgCam.ignore(c);

      this.planetObjs.push(c);
    }
  }

  private playSequence(w: number, h: number) {
    const popWindow = Math.min(2600, 600 + this.planetObjs.length * 28);

    for (const o of this.planetObjs) {
      const delay = Phaser.Math.Between(0, popWindow);

      this.tweens.add({
        targets: o,
        alpha: 1,
        scale: 1,
        ease: "Sine.easeOut",
        duration: Phaser.Math.Between(900, 1500),
        delay
      });
    }

    const fadeOutDelay = popWindow + 1600;

    this.tweens.add({
      targets: this.planetObjs,
      alpha: 0,
      ease: "Sine.easeInOut",
      duration: 2600,
      delay: fadeOutDelay
    });

    const inf = this.add.image(w / 2, h / 2, "infinity");
    inf.setScrollFactor(0);
    inf.setDepth(1000);
    inf.setTintFill(0xffffff);
    inf.setAlpha(0);
    inf.setScale(0.85);
    inf.setInteractive({ useHandCursor: true });
    this.bgCam.ignore(inf);

    inf.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.scene.start("Welcome");
    });

    this.tweens.add({
      targets: inf,
      alpha: 1,
      scale: 1,
      ease: "Sine.easeOut",
      duration: 2000,
      delay: fadeOutDelay + 800
    });

    this.tweens.add({
      targets: inf,
      scale: 1.05,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      duration: 1600,
      delay: fadeOutDelay + 2800
    });
  }

  private darkenColor(col: number, mul: number) {
    const c = Phaser.Display.Color.IntegerToColor(col);
    return Phaser.Display.Color.GetColor(
      Math.floor(c.red * mul),
      Math.floor(c.green * mul),
      Math.floor(c.blue * mul)
    );
  }
}
