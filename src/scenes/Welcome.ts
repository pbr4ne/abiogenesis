import Phaser from "phaser";
import BaseScene from "./BaseScene";
import WelcomePlanet from "./WelcomePlanet";
import { createStarfield, Starfield } from "../utilities/StarField";
import { Audio } from "../utilities/GameSounds";
import CreditsModal from "./CreditsModal";

export default class Welcome extends BaseScene {
  private bgCam!: Phaser.Cameras.Scene2D.Camera;
  private gameCam!: Phaser.Cameras.Scene2D.Camera;
  private starfield!: Starfield;
  private planet!: WelcomePlanet;
  private creditsModal!: CreditsModal;

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

    const BTN = 78;
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

      this.creditsModal = new CreditsModal({
        scene: this,
        rows: [
          [
            { iconKey: "programming", url: "https://github.com/pbr4ne", colour: 0x6cf5ff },
            { iconKey: "writing", url: "https://jamesfunfer.com", colour: 0xffc2f2 },
            { iconKey: "music", url: "https://www.youtube.com/user/Kitchen1066", colour: 0xfff08a },
            { iconKey: "voice", url: "https://jamesfunfer.com", colour: 0xb7ff9b }
          ],
          [
            { iconKey: "phaser", url: "https://phaser.io", colour: 0x9fd0ff },
            { iconKey: "icons", url: "https://www.freepik.com/icons", colour: 0xffa6a6 }
          ],
          [
            { iconKey: "lucky", colour: 0xd7b6ff },
            { iconKey: "litter", colour: 0xa6ffe9 },
            { iconKey: "dog", colour: 0xffd19a },
            { iconKey: "mooncat", colour: 0xff7ad6 },
            { iconKey: "starcat", colour: 0xffb3ff },
            { iconKey: "chameleon", colour: 0x78f2ff },
          ],
          [
            { iconKey: "raccoon", colour: 0xffc36b },
            { iconKey: "solarsystem", colour: 0xb6ff7a },
            { iconKey: "chaos", colour: 0xc9a8ff },
            { iconKey: "guitar", colour: 0xffee7a }
          ]
        ]
      });

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

    const creditsX = this.scale.width - PAD - BTN / 2;
    const creditsBtn = makeSquareButton(creditsX, uiY, "credits", () => {
      if (this.creditsModal.isOpen()) this.creditsModal.hide();
      else this.creditsModal.show();
    });


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
      creditsBtn.bg,
      creditsBtn.zone,
      creditsBtn.icon,

      musicToggle.bg,
      musicToggle.zone,
      musicToggle.left,
      musicToggle.right
    ];

    const startGame = () => {
      this.input.enabled = false;

      const planetR = 360 / 2;

      const wash = this.add
        .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x0f0f0f, 1)
        .setScrollFactor(0)
        .setDepth(999999)
        .setAlpha(0);

      const maskG = this.make.graphics({ x: 0, y: 0 });
      maskG.fillStyle(0xffffff, 1);
      maskG.fillCircle(this.planet.x, this.planet.y, planetR);

      const mask = maskG.createGeometryMask();
      wash.setMask(mask);

      wash.cameraFilter = this.bgCam.id;

      this.tweens.add({
        targets: wash,
        alpha: 1,
        duration: 1900,
        ease: "Sine.easeInOut",
        onComplete: () => {
          wash.setAlpha(1);

          this.planet.stopFlashing();

          this.scene.start("Terraforming");

          this.time.delayedCall(0, () => {
            wash.destroy();
            maskG.destroy();
          });
        }
      });
    };

    this.planet.onPlanetPointerDown(startGame);

    this.onShutdown(() => {
      btns.forEach((b) => b.destroy());
      this.creditsModal.destroy();
      this.starfield.destroy();
      this.planet.destroy();
      this.input.setDefaultCursor("default");
    });
  }
}
