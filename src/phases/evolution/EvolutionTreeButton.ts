import Phaser from "phaser";

export default class EvolutionTreeButton extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, onClick: () => void) {
    const pad = 18;
    const x = scene.scale.width - pad;
    const y = pad;

    super(scene, x, y, "evolution_tree");

    this.setOrigin(1, 0);
    this.setScrollFactor(0);
    this.setDepth(9999);
    this.setInteractive({ useHandCursor: true });

    //this.setDisplaySize(62, 62);

    this.on("pointerover", () => this.setScale(1.08));
    this.on("pointerout", () => this.setScale(1.0));
    this.on("pointerdown", () => onClick());

    scene.add.existing(this);
    
  }
}
