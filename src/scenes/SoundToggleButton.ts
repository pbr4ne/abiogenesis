import Phaser from "phaser";

type SoundToggleButtonCfg = {
  size?: number;
  radius?: number;
  depthBase?: number;
  iconOnKey: string;
  iconOffKey: string;
  getEnabled: () => boolean;
  setEnabled: (v: boolean) => void;
};

export default class SoundToggleButton {
  private scene: Phaser.Scene;

  private x: number;
  private y: number;

  private size: number;
  private r: number;

  private bg: Phaser.GameObjects.Graphics;
  private icon: Phaser.GameObjects.Image;
  private zone: Phaser.GameObjects.Zone;

  private hovered = false;

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: SoundToggleButtonCfg) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    this.size = cfg.size ?? 78;
    this.r = cfg.radius ?? 16;

    const depthBase = cfg.depthBase ?? 1000;

    this.bg = scene.add.graphics();
    this.bg.setScrollFactor(0);
    this.bg.setDepth(depthBase);

    this.icon = scene.add.image(x, y, cfg.getEnabled() ? cfg.iconOnKey : cfg.iconOffKey);
    this.icon.setScrollFactor(0);
    this.icon.setDepth(depthBase + 1);
    this.icon.setTintFill(0xffffff);
    this.icon.setAlpha(0.85);

    this.fitIconTo(this.icon, Math.floor(this.size * 0.62));

    this.zone = scene.add.zone(x, y, this.size, this.size);
    this.zone.setScrollFactor(0);
    this.zone.setDepth(depthBase + 2);
    this.zone.setInteractive({ useHandCursor: true });

    const draw = () => {
      this.bg.clear();

      this.bg.fillStyle(0x000000, this.hovered ? 0.52 : 0.40);
      this.bg.fillRoundedRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size, this.r);

      this.bg.lineStyle(2, 0xffffff, this.hovered ? 0.36 : 0.22);
      this.bg.strokeRoundedRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size, this.r);

      this.icon.setTexture(cfg.getEnabled() ? cfg.iconOnKey : cfg.iconOffKey);
    };

    const onOver = () => {
      this.hovered = true;
      draw();

      scene.tweens.killTweensOf(this.icon);
      scene.tweens.add({
        targets: this.icon,
        scale: this.icon.scaleX * 1.08,
        alpha: 1,
        duration: 120,
        ease: "Sine.easeOut"
      });
    };

    const onOut = () => {
      this.hovered = false;
      draw();

      scene.tweens.killTweensOf(this.icon);
      scene.tweens.add({
        targets: this.icon,
        scale: this.icon.scaleX / 1.08,
        alpha: 0.85,
        duration: 120,
        ease: "Sine.easeOut"
      });
    };

    const onDown = () => {
      cfg.setEnabled(!cfg.getEnabled());
      draw();
    };

    this.zone.on("pointerover", onOver);
    this.zone.on("pointerout", onOut);
    this.zone.on("pointerdown", onDown);

    draw();

    this.destroy = () => {
      this.zone.off("pointerover", onOver);
      this.zone.off("pointerout", onOut);
      this.zone.off("pointerdown", onDown);

      scene.tweens.killTweensOf(this.icon);

      this.bg.destroy();
      this.icon.destroy();
      this.zone.destroy();
    };
  }

  private fitIconTo(img: Phaser.GameObjects.Image, maxPx: number) {
    const maxDim = Math.max(img.width, img.height);
    const s = maxPx / maxDim;
    img.setScale(s);
  }

  getObjects(): Phaser.GameObjects.GameObject[] {
    return [this.bg, this.icon, this.zone];
  }

  refresh() {
    this.icon.setTexture(this.icon.texture.key);
  }

  destroy() { }
}
