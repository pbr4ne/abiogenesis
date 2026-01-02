import Phaser from "phaser";
import SoupProgress from "./SoupProgress";

export default class MoleculeMeters extends Phaser.GameObjects.Container {
  private g: Phaser.GameObjects.Graphics;
  private progress: SoupProgress;

  constructor(scene: Phaser.Scene, x: number, y: number, progress: SoupProgress) {
    super(scene, x, y);
    this.progress = progress;
    this.g = scene.add.graphics();
    this.add(this.g);

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.draw, this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.events.off(Phaser.Scenes.Events.UPDATE, this.draw, this);
    });
  }

  private draw() {
    const g = this.g;
    g.clear();

    const items = [
      { key: "A", label: "Adenine", col: 0xFF00FF },
      { key: "G", label: "Guanine", col: 0xFFFF00 },
      { key: "T", label: "Thymine", col: 0x00FF00 },
      { key: "C", label: "Cytosine", col: 0x00FFFF }
    ] as const;

    const w = 180;
    const h = 26;
    const gap = 18;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const y = i * (h + gap);

      const f = this.progress.getFill01(it.key);

      g.fillStyle(0x000000, 0.35);
      g.fillRect(0, y, w, h);

      g.fillStyle(it.col, 0.85);
      g.fillRect(0, y, w * f, h);
    }
  }
}
