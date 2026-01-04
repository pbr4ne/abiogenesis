import Phaser from "phaser";

export type DeathPoofConfig = {
  key?: string;
  depth?: number;

  startPx?: number;
  peakPx?: number;

  inMs?: number;
  outMs?: number;

  liftPx?: number;

  tintFill?: number;
};

export default class DeathPoof {
  private scene: Phaser.Scene;
  private cfg: Required<DeathPoofConfig>;

  constructor(scene: Phaser.Scene, cfg?: DeathPoofConfig) {
    this.scene = scene;
    this.cfg = {
      key: cfg?.key ?? "death",
      depth: cfg?.depth ?? 9999,
      startPx: cfg?.startPx ?? 10,
      peakPx: cfg?.peakPx ?? 50,
      inMs: cfg?.inMs ?? 420,
      outMs: cfg?.outMs ?? 600,
      liftPx: cfg?.liftPx ?? 8,
      tintFill: cfg?.tintFill ?? 0xffffff
    };
  }

  public playAt(x: number, y: number) {
    const img = this.scene.add.image(x, y, this.cfg.key);
    img.setOrigin(0.5, 0.55);
    img.setDepth(this.cfg.depth);
    img.setTintFill(this.cfg.tintFill);
    img.setAlpha(0);
    img.setDisplaySize(this.cfg.startPx, this.cfg.startPx);

    this.scene.tweens.add({
      targets: img,
      alpha: { from: 0, to: 0.95 },
      displayWidth: { from: this.cfg.startPx, to: this.cfg.peakPx },
      displayHeight: { from: this.cfg.startPx, to: this.cfg.peakPx },
      duration: this.cfg.inMs,
      ease: "Quad.Out",
      onComplete: () => {
        this.scene.tweens.add({
          targets: img,
          alpha: 0,
          y: y - this.cfg.liftPx,
          duration: this.cfg.outMs,
          ease: "Quad.In",
          onComplete: () => img.destroy()
        });
      }
    });
  }
}
