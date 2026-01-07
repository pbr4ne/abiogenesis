import Phaser from "phaser";

type EvolutionCometButtonCfg = {
  scene: Phaser.Scene;

  getPoints: () => number;
  minPointsToShow?: number;

  onClick?: () => void;

  xPad?: number;
  yOffset?: number;
  size?: number;
  xExtra?: number;
  depth?: number;
};

export default class EvolutionCometButton extends Phaser.GameObjects.Image {
  private getPoints: () => number;
  private minPointsToShow: number;
  private onClick?: () => void;

  private xPad: number;
  private yOffset: number;
  private size: number;
  private xExtra: number;
  private depthN: number;

  private hoverHidden = false;
  private pointsVisible = false;

  private baseScale = 1;
  private hoverTween?: Phaser.Tweens.Tween;

  private armed = false;

  private halo?: Phaser.GameObjects.Graphics;
  private haloTween?: Phaser.Tweens.Tween;
  private haloDx = -48;
  private haloDy = 44;

  constructor(cfg: EvolutionCometButtonCfg) {
    super(cfg.scene, 0, 0, "comet");

    this.getPoints = cfg.getPoints;
    this.minPointsToShow = cfg.minPointsToShow ?? 5;
    this.onClick = cfg.onClick;

    this.xPad = cfg.xPad ?? 22;
    this.yOffset = cfg.yOffset ?? -50;
    this.size = cfg.size ?? 200;
    this.xExtra = cfg.xExtra ?? 200;
    this.depthN = cfg.depth ?? 9999;

    this.setScrollFactor(0);
    this.setDepth(this.depthN);
    this.setInteractive({ useHandCursor: true });

    this.halo = this.scene.add.graphics();
    this.halo.setScrollFactor(0);
    this.halo.setDepth(this.depthN - 1);
    this.halo.setVisible(false);

    this.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.onClick?.();
    });

    this.on(Phaser.Input.Events.POINTER_OVER, () => {
      if (!this.visible) return;
      if (this.armed) return;
      this.setHoverFx(true);
    });

    this.on(Phaser.Input.Events.POINTER_OUT, () => {
      if (this.armed) return;
      this.setHoverFx(false);
    });

    this.layout();
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);

    this.setVisible(false);
    this.setAlpha(1);

    this.refresh();
  }

  public destroy(fromScene?: boolean) {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.hoverTween?.remove();
    this.hoverTween = undefined;

    this.haloTween?.remove();
    this.haloTween = undefined;
    this.halo?.destroy();
    this.halo = undefined;

    super.destroy(fromScene);
  }

  private layout() {
    this.setDisplaySize(this.size, this.size);
    this.setPosition(
      this.scene.scale.width - this.xPad - this.size / 2 - this.xExtra,
      this.scene.scale.height / 2 + this.yOffset
    );

    this.baseScale = this.scale;

    this.updateHalo();
  }

  private updateHalo() {
    if (!this.halo) return;

    this.halo.setPosition(0, 0);

    const cx = this.x + this.haloDx;
    const cy = this.y + this.haloDy;

    const r = (this.size * 0.62) * this.scale;
    this.halo.clear();
    this.halo.fillStyle(0xffcc55, 0.18);
    this.halo.fillCircle(cx, cy, r);
    this.halo.fillStyle(0xff5522, 0.10);
    this.halo.fillCircle(cx, cy, r * 0.72);
  }

  private setHoverFx(on: boolean) {
    this.hoverTween?.remove();
    this.hoverTween = undefined;

    if (on) {
      this.setTint(0xffffff);

      this.hoverTween = this.scene.tweens.add({
        targets: this,
        scale: this.baseScale * 1.08,
        duration: 120,
        ease: "Quad.easeOut",
        onUpdate: () => this.updateHalo()
      });
    } else {
      this.clearTint();

      this.hoverTween = this.scene.tweens.add({
        targets: this,
        scale: this.baseScale,
        duration: 140,
        ease: "Quad.easeOut",
        onUpdate: () => this.updateHalo()
      });
    }
  }

  public setArmedVisual(on: boolean) {
    if (this.armed === on) return;
    this.armed = on;

    this.hoverTween?.remove();
    this.hoverTween = undefined;

    if (!this.visible) {
      this.setArmedHalo(false);
      return;
    }

    if (on) {
      this.setTint(0xffffff);

      this.scene.tweens.add({
        targets: this,
        scale: this.baseScale * 1.12,
        duration: 120,
        ease: "Quad.easeOut",
        onUpdate: () => this.updateHalo()
      });

      this.setArmedHalo(true);
    } else {
      this.clearTint();

      this.scene.tweens.add({
        targets: this,
        scale: this.baseScale,
        duration: 140,
        ease: "Quad.easeOut",
        onUpdate: () => this.updateHalo()
      });

      this.setArmedHalo(false);
    }
  }

  private setArmedHalo(on: boolean) {
    if (!this.halo) return;

    this.haloTween?.remove();
    this.haloTween = undefined;

    this.halo.setVisible(on);

    if (!on) return;

    const pulse = { a: 0.18 };

    this.haloTween = this.scene.tweens.add({
      targets: pulse,
      a: 0.28,
      duration: 700,
      yoyo: true,
      loop: -1,
      ease: "Sine.easeInOut",
            onUpdate: () => {
        if (!this.halo) return;

        const cx = this.x + this.haloDx;
        const cy = this.y + this.haloDy;

        const r = (this.size * 0.62) * this.scale;
        this.halo.clear();
        this.halo.fillStyle(0xffcc55, pulse.a);
        this.halo.fillCircle(cx, cy, r);
        this.halo.fillStyle(0xff5522, pulse.a * 0.55);
        this.halo.fillCircle(cx, cy, r * 0.72);
      }
    });
  }

  public setHiddenForMainHover(isHoverActive: boolean) {
    this.hoverHidden = isHoverActive;
    this.applyVisibility();
  }

  public refresh() {
    const pts = this.getPoints();
    this.pointsVisible = pts >= this.minPointsToShow;
    this.applyVisibility();
  }

  private applyVisibility() {
    const vis = this.pointsVisible && !this.hoverHidden;
    this.setVisible(vis);

    if (!vis) {
      this.setHoverFx(false);
      this.setArmedHalo(false);
    } else {
      this.updateHalo();
      if (this.armed) this.setArmedHalo(true);
    }
  }

  public setUseHandCursor(on: boolean) {
    if (!this.input) return;
    (this.input as any).useHandCursor = on;
  }
}
