import Phaser from "phaser";
import LifeDetailsHover from "./LifeDetailsHover";
import { LifeFormInstance, LifeFormType } from "./EvolutionTypes";
import { LIFEFORMS } from "./LifeForms";
import { scoreByType100 } from "./EvolutionIntelligence";

type TopEntry = {
  type: LifeFormType;
  score100: number;
  count: number;
};

export default class EvolutionTop3Hud extends Phaser.GameObjects.Container {
  private hovers: LifeDetailsHover[] = [];
  private medal: Phaser.GameObjects.Image;

  private evoScale = 0.4;
  private gapX = 12;
  private padL = 20;
  private padB = 20;

  private getLifeForms: () => LifeFormInstance[];

  private lastKey = "";

  private hasShown = false;
  private fadeTween?: Phaser.Tweens.Tween;

  private onResize?: () => void;
  private cleanedUp = false;

  constructor(scene: Phaser.Scene, getLifeForms: () => LifeFormInstance[]) {
    super(scene, 0, 0);

    this.getLifeForms = getLifeForms;

    this.setScrollFactor(0);
    this.setDepth(20000);

    for (let i = 0; i < 3; i++) {
      const h = new LifeDetailsHover(scene);
      h.setDockMode("manual");
      h.setScale(this.evoScale);
      h.setVisible(false);
      this.hovers.push(h);
      this.add(h);
    }

    this.medal = scene.add.image(0, 0, "medal");
    this.medal.setScrollFactor(0);
    this.medal.setDepth(this.depth + 1);
    this.medal.setTintFill(0xffd400);
    this.medal.setAlpha(0.95);
    this.medal.setVisible(false);

    this.add(this.medal);

    scene.add.existing(this);
    this.setVisible(false);
    this.setAlpha(0);

    this.layout();

    this.onResize = () => this.layout();
    scene.scale.on("resize", this.onResize);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());
  }

  private cleanup() {
    if (this.cleanedUp) return;
    this.cleanedUp = true;

    const sc = this.scene;
    if (sc && this.onResize) {
      sc.scale.off("resize", this.onResize);
    }
    this.onResize = undefined;

    this.fadeTween?.stop();
    this.fadeTween = undefined;

    for (const h of this.hovers) h.destroy();
    this.hovers = [];

    this.medal?.destroy();

    this.destroy();
  }

  private layout() {
    const sc = this.scene;
    if (!sc || !sc.scale) return;

    const sh = sc.scale.height;

    const baseLeft = this.padL;
    const baseBottom = sh - this.padB;

    const sizes = this.hovers.map(h => {
      const wi = (h as any).wi as number;
      const hh = (h as any).h as number;
      return { w: wi * this.evoScale, h: hh * this.evoScale };
    });

    const maxH = Math.max(...sizes.map(s => s.h), 0);

    const cy = baseBottom - maxH / 2;

    let x = baseLeft;

    for (let i = 0; i < this.hovers.length; i++) {
      const h = this.hovers[i];
      const s = sizes[i];

      const cx = x + s.w / 2;
      h.dockManual(cx, cy);

      x += s.w + this.gapX;
    }
  }

  private clearHud() {
    this.lastKey = "";

    for (const h of this.hovers) {
      h.setLife(null);
      h.setVisible(false);
    }

    this.placeMedal(false);
  }

  public refresh() {
    if (!this.scene || this.cleanedUp) return;

    const lifeForms = this.getLifeForms();
    const top = this.computeTop3(lifeForms);

    const unlockedNow = top.length >= 3;
    if (unlockedNow && !this.hasShown) this.hasShown = true;

    if (!this.hasShown) return;

    if (!this.visible) {
      this.setVisible(true);
      this.setAlpha(0);

      this.fadeTween?.stop();
      this.fadeTween = this.scene.tweens.add({
        targets: this,
        alpha: 1,
        duration: 1000,
        ease: "Sine.easeOut"
      });
    }

    if (top.length === 0) {
      this.clearHud();
      return;
    }

    const key = top.map(t => `${t.type}:${t.score100}:${t.count}`).join("|");
    if (key === this.lastKey) return;
    this.lastKey = key;

    for (let i = 0; i < 3; i++) {
      const h = this.hovers[i];
      const e = top[i];

      h.setScale(this.evoScale);

      if (!e) {
        h.setLife(null);
        h.setVisible(false);
        continue;
      }

      const def = LIFEFORMS[e.type];
      h.setVisible(true);
      h.setLife({ lf: null, def, mode: "summary", score100: e.score100, extinct: false });
    }

    this.layout();
    this.placeMedal(top.length > 0);
  }

  private placeMedal(visible: boolean) {
    this.medal.setVisible(visible);
    if (!visible) return;

    const topHover = this.hovers[0];
    if (!topHover.visible) {
      this.medal.setVisible(false);
      return;
    }

    const hh = (topHover as any).h as number;

    const h = hh * this.evoScale;

    const medalSize = 48;
    this.medal.setDisplaySize(medalSize, medalSize);

    const x = topHover.x + 57;
    const y = topHover.y - h / 2 - medalSize * 0.8 + 63;

    this.medal.setPosition(x, y);
  }

  private computeTop3(lifeForms: LifeFormInstance[]): TopEntry[] {
    const counts = new Map<LifeFormType, number>();
    for (const lf of lifeForms) {
      counts.set(lf.type, (counts.get(lf.type) ?? 0) + 1);
    }

    const score100ByType = scoreByType100(lifeForms);

    const entries: TopEntry[] = [];
    for (const [type, score100] of score100ByType) {
      const count = counts.get(type) ?? 0;
      if (count <= 0) continue;
      entries.push({ type, score100, count });
    }

    entries.sort((a, b) => {
      if (b.score100 !== a.score100) return b.score100 - a.score100;
      if (b.count !== a.count) return b.count - a.count;
      return a.type < b.type ? -1 : a.type > b.type ? 1 : 0;
    });

    return entries.slice(0, 3);
  }
}
