import Phaser from "phaser";

export default class LifeButton extends Phaser.GameObjects.Container {
  public readonly colourHex: string;

  private bg!: Phaser.GameObjects.Rectangle;
  private outline!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;

  private hitZone!: Phaser.GameObjects.Zone;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    opts: { label: string; colourHex: string; width?: number; height?: number }
  ) {
    super(scene, x, y);

    const w = opts.width ?? 120;
    const h = opts.height ?? 44;

    this.colourHex = opts.colourHex;

    this.bg = scene.add.rectangle(0, 0, w, h, Phaser.Display.Color.HexStringToColor(opts.colourHex).color, 0.95);
    this.bg.setOrigin(0.5, 0.5);

    this.outline = scene.add.rectangle(0, 0, w + 6, h + 6, 0x000000, 0);
    this.outline.setOrigin(0.5, 0.5);
    this.outline.setStrokeStyle(3, 0xffffff, 0);

    this.label = scene.add.text(0, 0, opts.label, {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff"
    });
    this.label.setOrigin(0.5, 0.5);

    this.add([this.outline, this.bg, this.label]);

    this.hitZone = scene.add.zone(-w / 2, -h / 2, w, h);
    this.hitZone.setOrigin(0, 0);
    this.hitZone.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    this.add(this.hitZone);

    this.hitZone.on("pointerdown", () => {
      this.emit("selected", this.colourHex);
    });
  }

  public setSelected(selected: boolean) {
    this.outline.setStrokeStyle(3, 0xffffff, selected ? 1 : 0);
  }
}
