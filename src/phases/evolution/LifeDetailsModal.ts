import Phaser from "phaser";
import { LifeFormDef, LifeFormInstance } from "./EvolutionTypes";

export type LifeHoverPayload = { lf: LifeFormInstance; def: LifeFormDef } | null;

export default class LifeDetailsModal extends Phaser.GameObjects.Container {
  private backdrop: Phaser.GameObjects.Rectangle;
  private panel: Phaser.GameObjects.Rectangle;
  private title: Phaser.GameObjects.Text;
  private text: Phaser.GameObjects.Text;
  private icon: Phaser.GameObjects.Image;
  private closeHit: Phaser.GameObjects.Rectangle;
  private closeText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    const sw = scene.scale.width;
    const sh = scene.scale.height;

    this.backdrop = scene.add.rectangle(0, 0, sw, sh, 0x000000, 0.55);
    this.backdrop.setOrigin(0, 0);
    this.backdrop.setInteractive();

    const w = Math.min(820, sw - 120);
    const h = Math.min(560, sh - 120);

    const x = sw / 2;
    const y = sh / 2;

    this.panel = scene.add.rectangle(x, y, w, h, 0x0b0b0b, 0.96);
    this.panel.setStrokeStyle(3, 0xffffff, 0.25);

    const pad = 24;

    this.title = scene.add.text(x - w / 2 + pad, y - h / 2 + pad, "", {
      fontFamily: "Arial",
      fontSize: "26px",
      color: "#ffffff"
    });

    const iconSize = 96;
    this.icon = scene.add.image(x - w / 2 + pad + iconSize / 2, y - h / 2 + pad + 56 + iconSize / 2, "prokaryote");
    this.icon.setDisplaySize(iconSize, iconSize);

    this.text = scene.add.text(x - w / 2 + pad, y - h / 2 + pad + 56 + iconSize + 16, "", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
      wordWrap: { width: w - pad * 2 }
    });

    const closeW = 44;
    const closeH = 36;
    const closeX = x + w / 2 - pad - closeW / 2;
    const closeY = y - h / 2 + pad + closeH / 2 - 4;

    this.closeHit = scene.add.rectangle(closeX, closeY, closeW, closeH, 0x000000, 0);
    this.closeHit.setInteractive({ useHandCursor: true });

    this.closeText = scene.add.text(closeX, closeY, "✕", {
      fontFamily: "Arial",
      fontSize: "26px",
      color: "#ffffff"
    });
    this.closeText.setOrigin(0.5, 0.5);

    this.add([
      this.backdrop,
      this.panel,
      this.title,
      this.icon,
      this.text,
      this.closeHit,
      this.closeText
    ]);

    this.setScrollFactor(0);
    this.setDepth(10000);
    this.setVisible(false);

    this.backdrop.on("pointerdown", () => this.hide());
    this.closeHit.on("pointerdown", () => this.hide());

    scene.add.existing(this);
  }

  public show(payload: LifeHoverPayload) {
    if (!payload) return;

    const { lf, def } = payload;

    const tint =
      (def.colour.r << 16) |
      (def.colour.g << 8) |
      def.colour.b;

    this.panel.setStrokeStyle(3, tint, 0.9);

    this.icon.setTexture(def.type);
    this.icon.setTintFill(tint);

    const habitats = def.habitats.join(", ");
    const mutates = def.mutatesTo.length ? def.mutatesTo.join(", ") : "none";

    this.title.setText(def.type.toUpperCase());

    this.text.setText(
      [
        `Habitat: ${habitats}`,
        `Rarity: ${def.rarity}`,
        `Mutates to: ${mutates}`,
        ``,
        `Mutation: ${lf.mutationRate}/10`,
        `Reproduction: ${lf.reproductionRate}/10`,
        `Survival: ${lf.survivalRate}/10`,
        ``,
        `Cell: (${lf.row}, ${lf.col})`,
        `ID: ${lf.id}`
      ].join("\n")
    );

    this.setVisible(true);
  }

  public hide() {
    this.setVisible(false);
  }

  public isOpen() {
    return this.visible;
  }
}
