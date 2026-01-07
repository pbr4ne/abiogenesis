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

    this.on("pointerdown", () => {
      this.onClick?.();
    });

    this.layout();
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);

    this.setVisible(false);
    this.setAlpha(1);

    this.refresh();
  }

  public destroy(fromScene?: boolean) {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    super.destroy(fromScene);
  }

  private layout() {
    this.setDisplaySize(this.size, this.size);
    this.setPosition(
      this.scene.scale.width - this.xPad - this.size / 2 - this.xExtra,
      this.scene.scale.height / 2 + this.yOffset
    );
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
    this.setVisible(this.pointsVisible && !this.hoverHidden);
  }
}
