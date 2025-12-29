import Phaser from "phaser";
import Planet from "./Planet";

export default class AverageColourBox extends Phaser.GameObjects.Container {
  private planet: Planet;
  private frame!: Phaser.GameObjects.Rectangle;
  private lastUpdateAt = 0;
  private intervalMs: number;

  constructor(
    scene: Phaser.Scene,
    planet: Planet,
    x: number,
    y: number,
    opts?: { width?: number; height?: number; intervalMs?: number }
  ) {
    super(scene, x, y);

    this.planet = planet;

    const w = opts?.width ?? 180;
    const h = opts?.height ?? 56;
    this.intervalMs = opts?.intervalMs ?? 200;

    this.frame = scene.add.rectangle(0, 0, w, h, 0x000000, 1);
    this.frame.setOrigin(1, 0);
    this.frame.setStrokeStyle(1, 0xffffff, 1);

    this.add([this.frame]);

    this.setSize(w, h);

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate);
    });

    this.refresh();
  }

  private onUpdate = () => {
    const now = this.scene.time.now;
    if (now - this.lastUpdateAt < this.intervalMs) return;
    this.lastUpdateAt = now;

    this.refresh();
  };

  private refresh() {
    const avg = this.planet.getAverageColour();

    if (!avg) {
      return;
    }

    const col = Phaser.Display.Color.GetColor(avg.r, avg.g, avg.b);

    this.frame.setFillStyle(col, 1);
  }
}
