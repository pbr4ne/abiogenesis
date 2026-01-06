import Phaser from "phaser";

type PhaseGroup = "planet" | "dna" | "dolphin" | "system";

export default class PhaseBreadcrumb extends Phaser.GameObjects.Container {
  private icons: Phaser.GameObjects.Image[] = [];
  private iconKeys: PhaseGroup[] = ["planet", "dna", "dolphin", "system"];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    active: PhaseGroup,
    activeCol: number,
  ) {
    super(scene, x, y);

    this.setScrollFactor(0);
    this.setDepth(100000);

    const iconH = 60;
    const arrowH = 42;
    const gap = 16;

    let cx = 0;

    for (let i = 0; i < this.iconKeys.length; i++) {
      const key = this.iconKeys[i];

      const icon = scene.add.image(cx, 0, key);
      icon.setOrigin(0, 0.5);

      const scale = iconH / Math.max(1, icon.height);
      icon.setScale(scale);

      this.icons.push(icon);
      this.add(icon);

      cx += icon.displayWidth;

      if (i < this.iconKeys.length - 1) {
        cx += gap;

        const arrow = scene.add.image(cx, 0, "arrow");
        arrow.setOrigin(0, 0.5);

        const aScale = arrowH / Math.max(1, arrow.height);
        arrow.setScale(aScale);

        arrow.setTintFill(0x666666);
        arrow.setAlpha(0.9);

        this.add(arrow);

        cx += arrow.displayWidth + gap;
      }
    }

    this.setActivePhase(active, activeCol);
  }

  public setActivePhase(active: PhaseGroup, activeCol: number) {
    const inactiveCol = 0x666666;

    for (let i = 0; i < this.icons.length; i++) {
      const icon = this.icons[i];
      const isActive = this.iconKeys[i] === active;

      icon.setTintFill(isActive ? activeCol : inactiveCol);
      icon.setAlpha(isActive ? 1 : 0.8);

      const baseScale = 60 / Math.max(1, icon.height);
      const s = isActive ? baseScale * 1.10 : baseScale;
      icon.setScale(s);
    }
  }
}
