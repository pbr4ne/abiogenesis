import Phaser from "phaser";
import BaseScene from "./BaseScene";
import WelcomePlanet from "./WelcomePlanet";
import { createStarfield, Starfield } from "../utilities/StarField";
import { Audio } from "../utilities/GameSounds";

export default class Welcome extends BaseScene {
  private bgCam!: Phaser.Cameras.Scene2D.Camera;
  private gameCam!: Phaser.Cameras.Scene2D.Camera;
  private starfield!: Starfield;
  private planet!: WelcomePlanet;

  constructor() {
    super("Welcome");
  }

  create(): void {
    super.create();

    Audio.init(this.sys.game);
    Audio.stopAll();

    this.bgCam = this.cameras.main;
    this.gameCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);

    this.starfield = createStarfield(this, this.bgCam, this.gameCam);

    this.planet = new WelcomePlanet(this, this.scale.width / 2, this.scale.height / 2);
    this.add.existing(this.planet);
    this.bgCam.ignore(this.planet);

    this.planet.startFlashing();

    const BTN = 100;
    const PAD = 34;
    const GAP = 18;
    const R = 16;

    const fitIconTo = (img: Phaser.GameObjects.Image, maxPx: number) => {
      const maxDim = Math.max(img.width, img.height);
      const s = maxPx / maxDim;
      img.setScale(s);
    };

    const drawSquare = (
      g: Phaser.GameObjects.Graphics,
      cx: number,
      cy: number,
      w: number,
      h: number,
      hovered: boolean
    ) => {
      g.clear();

      g.fillStyle(0x000000, hovered ? 0.52 : 0.40);
      g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, R);

      g.lineStyle(2, 0xffffff, hovered ? 0.36 : 0.22);
      g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, R);
    };

    const makeSquareIcon = (key: string, x: number, y: number) => {
      const baseAlpha = 0.5;

      const img = this.add.image(x, y, key);
      img.setScrollFactor(0);
      img.setDepth(11);
      img.setTintFill(0xffffff);
      img.setAlpha(baseAlpha);

      fitIconTo(img, Math.floor(BTN * 0.68));

      const baseScale = img.scaleX;

      const tweenTo = (scaleMul: number, alpha: number) => {
        this.tweens.killTweensOf(img);
        this.tweens.add({
          targets: img,
          scale: baseScale * scaleMul,
          alpha,
          duration: 120,
          ease: "Sine.easeOut"
        });
      };

      return { img, tweenTo, baseAlpha };
    };

    const makeSquareButton = (x: number, y: number, iconKey: string, onClick?: () => void) => {
      const bg = this.add.graphics();
      bg.setScrollFactor(0);
      bg.setDepth(10);

      const zone = this.add.zone(x, y, BTN, BTN);
      zone.setScrollFactor(0);
      zone.setDepth(12);
      zone.setInteractive({ useHandCursor: true });

      const icon = makeSquareIcon(iconKey, x, y);

      let hovered = false;
      const redraw = () => drawSquare(bg, x, y, BTN, BTN, hovered);
      redraw();

      zone.on("pointerover", () => {
        hovered = true;
        redraw();
        icon.tweenTo(1.10, 1.0);
      });

      zone.on("pointerout", () => {
        hovered = false;
        redraw();
        icon.tweenTo(1.0, icon.baseAlpha);
      });

      zone.on("pointerdown", () => onClick?.());

      return { bg, zone, icon: icon.img };
    };

    const makeToggle2x = (
      x: number,
      y: number,
      leftKey: string,
      rightKey: string,
      initialRightActive: boolean,
      onChange?: (rightActive: boolean) => void
    ) => {
      const w = BTN * 2 + GAP;
      const h = BTN;

      const bg = this.add.graphics();
      bg.setScrollFactor(0);
      bg.setDepth(10);

      const zone = this.add.zone(x, y, w, h);
      zone.setScrollFactor(0);
      zone.setDepth(12);
      zone.setInteractive({ useHandCursor: true });

      const leftX = x - w / 2 + BTN / 2;
      const rightX = x + w / 2 - BTN / 2;

      const left = makeSquareIcon(leftKey, leftX, y);
      const right = makeSquareIcon(rightKey, rightX, y);

      let rightActive = initialRightActive;
      let hovered = false;

      const applyIconState = () => {
        const inactiveAlpha = 0.35;
        const activeAlpha = 1.0;

        const leftTargetAlpha = rightActive ? inactiveAlpha : activeAlpha;
        const rightTargetAlpha = rightActive ? activeAlpha : inactiveAlpha;

        if (hovered) {
          left.tweenTo(1.08, rightActive ? 0.75 : 1.0);
          right.tweenTo(1.08, rightActive ? 1.0 : 0.75);
        } else {
          left.tweenTo(1.0, leftTargetAlpha);
          right.tweenTo(1.0, rightTargetAlpha);
        }
      };

      const redraw = () => {
        bg.clear();

        bg.fillStyle(0x000000, hovered ? 0.52 : 0.40);
        bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, R);

        bg.lineStyle(2, 0xffffff, hovered ? 0.36 : 0.22);
        bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, R);

        bg.lineStyle(1, 0xffffff, hovered ? 0.18 : 0.12);
        bg.beginPath();
        bg.moveTo(x, y - h / 2 + 12);
        bg.lineTo(x, y + h / 2 - 12);
        bg.strokePath();

        const selX = rightActive ? rightX : leftX;
        bg.fillStyle(0xffffff, hovered ? 0.10 : 0.08);
        bg.fillRoundedRect(selX - BTN / 2 + 6, y - BTN / 2 + 6, BTN - 12, BTN - 12, R - 6);

        applyIconState();
      };

      const setRightActive = (v: boolean) => {
        if (rightActive === v) return;
        rightActive = v;
        redraw();
        onChange?.(rightActive);
      };

      redraw();
      onChange?.(rightActive);

      zone.on("pointerover", () => {
        hovered = true;
        redraw();
      });

      zone.on("pointerout", () => {
        hovered = false;
        redraw();
      });

      zone.on("pointerdown", (p: Phaser.Input.Pointer) => {
        const localX = p.x - (x - w / 2);
        setRightActive(localX > w / 2);
      });

      return { bg, zone, left: left.img, right: right.img, isRightActive: () => rightActive };
    };

    const uiY = this.scale.height - PAD - BTN / 2;

    const clearX = this.scale.width - PAD - BTN / 2;
    const clearBtn = makeSquareButton(clearX, uiY, "clear_save", () => { });

    const creditsX = clearX - (BTN + GAP);
    const creditsBtn = makeSquareButton(creditsX, uiY, "credits", () => { });

    const toggleW = BTN * 2 + GAP;
    const toggleX = creditsX - BTN / 2 - GAP - toggleW / 2;
    const musicToggle = makeToggle2x(
      toggleX,
      uiY,
      "sound_on",
      "sound_off",
      !Audio.isSoundEnabled(),
      (rightActive) => {
        Audio.setSoundEnabled(!rightActive);
      }
    );

    const btns: Phaser.GameObjects.GameObject[] = [
      clearBtn.bg,
      clearBtn.zone,
      clearBtn.icon,

      creditsBtn.bg,
      creditsBtn.zone,
      creditsBtn.icon,

      musicToggle.bg,
      musicToggle.zone,
      musicToggle.left,
      musicToggle.right
    ];

    const startGame = () => {
      this.planet.stopFlashing();
      this.cameras.main.fadeOut(150, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
        this.scene?.start("Terraforming")
      );
    };

    this.planet.onPlanetPointerDown(startGame);

    this.onShutdown(() => {
      btns.forEach((b) => b.destroy());
      this.starfield.destroy();
      this.planet.destroy();
      this.input.setDefaultCursor("default");
    });
  }
}
