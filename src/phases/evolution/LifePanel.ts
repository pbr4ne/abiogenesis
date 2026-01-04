import Phaser from "phaser";
import { LifeFormDef, LifeFormInstance } from "./EvolutionTypes";

export type LifePayload = { lf: LifeFormInstance; def: LifeFormDef } | null;

export default class LifeHPanel extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private text: Phaser.GameObjects.Text;
  private icon: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    const w = 360;
    const h = 260;
    const pad = 16;

    const x = scene.scale.width - w / 2 - 24;
    const y = 180;

    this.setPosition(x, y);
    this.setScrollFactor(0);

    this.bg = scene.add.rectangle(0, 0, w, h, 0x0b0b0b, 0.75);
    this.bg.setStrokeStyle(2, 0xffffff, 0.2);

    const iconSize = 64;
    const iconX = -w / 2 + pad + iconSize / 2;
    const iconY = -h / 2 + pad + iconSize / 2;

    this.icon = scene.add.image(iconX, iconY, "prokaryote");
    this.icon.setDisplaySize(iconSize, iconSize);

    const textX = -w / 2 + pad;
    const textY = -h / 2 + pad + iconSize + 10;

    this.text = scene.add.text(textX, textY, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      wordWrap: { width: w - pad * 2 }
    });

    this.add([this.bg, this.icon, this.text]);
    this.setVisible(false);

    scene.add.existing(this);
  }

  public setLife(payload: LifePayload) {
    if (!payload) {
      this.setVisible(false);
      return;
    }

    const { lf, def } = payload;

    const tint =
      (def.colour.r << 16) |
      (def.colour.g << 8) |
      def.colour.b;

    this.icon.setTexture(def.type);
    this.icon.setTintFill(tint);

    this.bg.setStrokeStyle(2, tint, 0.9);

    const habitats = def.habitats.join(", ");
    const mutates = def.mutatesTo.length ? def.mutatesTo.join(", ") : "none";

    this.text.setText(
      [
        `${def.type.toUpperCase()}`,
        ``,
        `Habitat: ${habitats}`,
        `Rarity: ${def.rarity}`,
        `Mutates to: ${mutates}`,
        ``,
        `Mutation: ${lf.mutationRate}/10`,
        `Reproduction: ${lf.reproductionRate}/10`,
        `Survival: ${lf.survivalRate}/10`
      ].join("\n")
    );

    this.setVisible(true);
  }
}
