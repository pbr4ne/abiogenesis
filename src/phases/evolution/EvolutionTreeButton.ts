import Phaser from "phaser";

export default class EvolutionTreeButton extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Arc;
  private ring: Phaser.GameObjects.Arc;
  private img: Phaser.GameObjects.Image;

  private base = 150;
  private hover = 155;

  private iconDown = 8;

  constructor(scene: Phaser.Scene, onClick: () => void) {
    const pad = 18;
    const x = scene.scale.width - pad;
    const y = pad;

    super(scene, x, y);

    this.setScrollFactor(0);
    this.setDepth(9999);

    this.bg = scene.add.circle(0, 0, 1, 0x0b0b0b, 0.70) as Phaser.GameObjects.Arc;

    this.ring = scene.add.circle(0, 0, 1, 0x000000, 0) as Phaser.GameObjects.Arc;
    this.ring.setStrokeStyle(2, 0xffffff, 0.18);

    this.img = scene.add.image(0, 0, "evolution_tree");
    this.img.setDisplaySize(this.base, this.base);

    this.add([this.bg, this.ring, this.img]);

    this.applySize(this.base, false);

    const onOver = () => this.applySize(this.hover, true);
    const onOut = () => this.applySize(this.base, false);
    const onDown = () => onClick();

    this.bg.on("pointerover", onOver);
    this.bg.on("pointerout", onOut);
    this.bg.on("pointerdown", onDown);

    this.img.setInteractive({ useHandCursor: true });
    this.img.on("pointerover", onOver);
    this.img.on("pointerout", onOut);
    this.img.on("pointerdown", onDown);
  }

  private applySize(size: number, hover: boolean) {
    const plateR = (size + 18) / 2;

    this.bg.setRadius(plateR);
    this.ring.setRadius(plateR);

    this.bg.setFillStyle(0x0b0b0b, hover ? 0.82 : 0.70);
    this.ring.setStrokeStyle(2, 0xffffff, hover ? 0.30 : 0.18);

    this.img.setDisplaySize(size, size);

    this.bg.setPosition(-plateR, plateR);
    this.ring.setPosition(-plateR, plateR);
    this.img.setPosition(-plateR, plateR + this.iconDown);

    this.bg.setInteractive(
      new Phaser.Geom.Circle(this.bg.x, this.bg.y, plateR),
      Phaser.Geom.Circle.Contains
    );
  }
}
