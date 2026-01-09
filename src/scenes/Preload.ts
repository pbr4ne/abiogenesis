import Phaser from "phaser";
import assetPackUrl from "../../static/assets/asset-pack.json";
import { log } from "../utilities/GameUtils";

export default class Preload extends Phaser.Scene {
  private ringG?: Phaser.GameObjects.Graphics;

  private progress = 0;

  private lastProgressAt = 0;
  private baseRotSpeed = 0.35;
  private stallRotSpeed = 1.15;
  private stallAfterMs = 250;

  private pulseTween?: Phaser.Tweens.Tween;

  constructor() {
    super("Preload");
  }

  private layout(): void {
    if (!this.ringG) return;

    const w = this.scale.width;
    const h = this.scale.height;

    this.ringG.setPosition(w / 2, h / 2);
    this.redraw();
  }

  private redraw(): void {
    if (!this.ringG) return;

    const radius = Math.min(this.scale.width, this.scale.height) * 0.18;
    const thickness = Math.max(6, radius * 0.12);

    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * this.progress;

    this.ringG.clear();

    this.ringG.lineStyle(thickness * 1.55, 0xffffff, 0.12);
    this.ringG.beginPath();
    this.ringG.arc(0, 0, radius, startAngle, endAngle, false);
    this.ringG.strokePath();

    this.ringG.lineStyle(thickness * 1.25, 0xffffff, 0.08);
    this.ringG.beginPath();
    this.ringG.arc(0, 0, radius, startAngle, endAngle, false);
    this.ringG.strokePath();

    this.ringG.lineStyle(thickness, 0xffffff, 1);
    this.ringG.beginPath();
    this.ringG.arc(0, 0, radius, startAngle, endAngle, false);
    this.ringG.strokePath();
  }

  editorCreate(): void {
    this.ringG = this.add.graphics();
    this.ringG.setAlpha(0.95);

    this.lastProgressAt = this.time.now;

    this.pulseTween = this.tweens.add({
      targets: this.ringG,
      scale: { from: 0.985, to: 1.03 },
      alpha: { from: 0.78, to: 1.0 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    this.layout();
    this.scale.on("resize", this.layout, this);

    this.load.on("progress", (p: number) => {
      this.progress = p;
      this.lastProgressAt = this.time.now;
      this.redraw();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.layout, this);
      this.load.off("progress");
      this.pulseTween?.stop();
      this.pulseTween?.remove();
    });

    this.events.emit("scene-awake");
  }

  update(_t: number, dtMs: number): void {
    if (!this.ringG) return;

    const stalled = this.time.now - this.lastProgressAt > this.stallAfterMs;
    const speed = stalled ? this.stallRotSpeed : this.baseRotSpeed;

    this.ringG.rotation += speed * (dtMs / 1000);
  }

  preload(): void {
    if (!this.ringG) this.editorCreate();

    this.load.pack("asset-pack", assetPackUrl);
    log("PRELOAD COMPLETE");
  }

  create(): void {
    this.scene.start("Init");
  }
}
