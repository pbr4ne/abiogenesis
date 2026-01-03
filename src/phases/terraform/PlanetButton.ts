import Phaser from "phaser";

type PlanetButtonCfg = {
  x: number;
  y: number;
  size?: number;
  imageKey?: string;
  onClick: () => void;
};

export default class PlanetButton {
  public readonly container: Phaser.GameObjects.Container;

  private scene: Phaser.Scene;
  private bg: Phaser.GameObjects.Graphics;
  private hit: Phaser.GameObjects.Zone;

  private size: number;
  private half: number;
  private onClick: () => void;

  constructor(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, cfg: PlanetButtonCfg) {
    this.scene = scene;

    this.size = cfg.size ?? 120;
    this.half = this.size / 2;
    this.onClick = cfg.onClick;

    this.container = scene.add.container(cfg.x, cfg.y);

    this.bg = scene.add.graphics();
    this.draw(0x494949);

    const img = scene.add.image(0, 0, cfg.imageKey ?? "planet");
    const pad = 16;
    const max = this.size - pad * 2;
    const scale = Math.min(max / img.width, max / img.height);
    img.setScale(scale);

    this.hit = scene.add.zone(0, 0, this.size, this.size).setOrigin(0.5, 0.5);
    this.hit.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.size, this.size), Phaser.Geom.Rectangle.Contains);

    this.hit.on("pointerover", () => {
      this.scene.input.setDefaultCursor("pointer");
      this.draw(0xffd84d);
      this.container.setScale(1.03);
    });

    this.hit.on("pointerout", () => {
      this.scene.input.setDefaultCursor("default");
      this.draw(0x494949);
      this.container.setScale(1.0);
    });

    this.hit.on("pointerdown", () => this.onClick());

    this.container.add(this.bg);
    this.container.add(img);
    this.container.add(this.hit);

    parent.add(this.container);
  }

  private draw(strokeColor: number) {
    this.bg.clear();
    this.bg.fillStyle(0x20202c, 1);
    this.bg.fillRect(-this.half, -this.half, this.size, this.size);
    this.bg.lineStyle(6, strokeColor, 1);
    this.bg.strokeRect(-this.half, -this.half, this.size, this.size);
  }

  public destroy() {
    this.container.destroy();
  }
}
