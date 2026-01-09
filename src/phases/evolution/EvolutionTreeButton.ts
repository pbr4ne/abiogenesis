import Phaser from "phaser";

export default class EvolutionTreeButton extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private img: Phaser.GameObjects.Image;
  private hit: Phaser.GameObjects.Zone;

  private size = 120;
  private half!: number;

  constructor(scene: Phaser.Scene, onClick: () => void) {
    const pad = 18;
    const size = 120;
    const half = size / 2;

    const x = scene.scale.width - pad - half;
    const y = pad + half;

    super(scene, x, y);

    this.size = size;
    this.half = half;

    this.setScrollFactor(0);
    this.setDepth(9999);

    this.bg = scene.add.graphics();
    this.draw(0x494949);

    this.img = scene.add.image(0, 0, "evolution_tree");

    const innerPad = 16;
    const max = this.size - innerPad * 2;
    const scale = Math.min(max / this.img.width, max / this.img.height);
    this.img.setScale(scale);
    this.img.setTintFill(0xff1cb7);

    this.img.y += 2;

    this.hit = scene.add.zone(0, 0, this.size, this.size).setOrigin(0.5, 0.5);
    this.hit.setInteractive({ useHandCursor: true });

    this.hit.on("pointerover", () => {
      this.scene.input.setDefaultCursor("pointer");
      this.draw(0xffd84d);
      this.setScale(1.03);
    });

    this.hit.on("pointerout", () => {
      this.scene.input.setDefaultCursor("default");
      this.draw(0x494949);
      this.setScale(1.0);
    });

    this.hit.on("pointerdown", () => onClick());

    this.add([this.bg, this.img, this.hit]);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.scene) this.scene.input.setDefaultCursor("default");
    });
  }

  private draw(strokeColor: number) {
    this.bg.clear();

    const r = Math.max(12, Math.round(this.size * 0.12));

    this.bg.fillStyle(0x20202c, 1);
    this.bg.fillRoundedRect(-this.half, -this.half, this.size, this.size, r);

    this.bg.lineStyle(6, strokeColor, 1);
    this.bg.strokeRoundedRect(-this.half, -this.half, this.size, this.size, r);
  }
}
