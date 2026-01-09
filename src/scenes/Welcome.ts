import Phaser from "phaser";
import BaseScene from "./BaseScene";
import PlanetBase from "../planet/PlanetBase";
import { createStarfield, Starfield } from "../utilities/StarField";

const hsvToRgb = (h: number, s: number, v: number) => {
  const c = v * s;
  const hh = (h % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0,
    g = 0,
    b = 0;

  if (hh < 1) {
    r = c;
    g = x;
  } else if (hh < 2) {
    r = x;
    g = c;
  } else if (hh < 3) {
    g = c;
    b = x;
  } else if (hh < 4) {
    g = x;
    b = c;
  } else if (hh < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const m = v - c;
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
};

const rgbToHexStr = (r: number, g: number, b: number) =>
  "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);

type CellState = {
  h: number;
  s: number;
  v: number;
  targetV: number;
  white01: number;
};

class WelcomePlanet extends PlanetBase {
  private tickEv?: Phaser.Time.TimerEvent;
  private glowEv?: Phaser.Time.TimerEvent;
  private cells: CellState[] = [];

  private glowRow = 0;
  private glowCol = 0;
  private glowT = 0;
  private glowDurMs = 0;

  private hoverMul = 1;
  private hoverTween?: Phaser.Tweens.Tween;
  private destroyed = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      diameter: 360,
      divisions: 40,
      tiltDeg: -28,
      yawDeg: 20,
      wireAlpha: 0.28
    });

    this.hitZone.on("pointerover", this.onOver);
    this.hitZone.on("pointerout", this.onOut);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.destroyed = true;
      this.hitZone.off("pointerover", this.onOver);
      this.hitZone.off("pointerout", this.onOut);
    });
  }

  private clamp01(x: number) {
    return Math.max(0, Math.min(1, x));
  }

  private idx(row: number, col: number) {
    return row * this.divisions + col;
  }

  private mixToWhiteFromRgb(r: number, g: number, b: number, white01: number) {
    const w = this.clamp01(white01);
    const rr = Math.round(r + (255 - r) * w);
    const gg = Math.round(g + (255 - g) * w);
    const bb = Math.round(b + (255 - b) * w);
    return rgbToHexStr(rr, gg, bb);
  }

  private apply(row: number, col: number, c: CellState) {
    const v = this.clamp01(c.v * this.hoverMul);
    const { r, g, b } = hsvToRgb(c.h, c.s, v);

    const outHex = this.mixToWhiteFromRgb(r, g, b, c.white01);
    this.gridData.setHex(row, col, outHex, 1);
  }

  private setHoverMul(to: number) {
    if (this.destroyed) return;

    this.hoverTween?.stop();
    this.hoverTween = this.scene?.tweens?.add({
      targets: this,
      hoverMul: to,
      duration: to > this.hoverMul ? 120 : 180,
      ease: "Sine.easeOut",
      onUpdate: () => {
        this.redrawAll();
      }
    });
  }

  private onOver = () => {
    if (this.destroyed) return;
    this.scene?.input?.setDefaultCursor("pointer");
    this.setHoverMul(2);
  };

  private onOut = () => {
    if (this.destroyed) return;
    this.scene?.input?.setDefaultCursor("default");
    this.setHoverMul(1);
  };

  private initCells() {
    const div = this.divisions;
    this.cells.length = div * div;

    for (let row = 0; row < div; row++) {
      for (let col = 0; col < div; col++) {
        const c: CellState = {
          h: Phaser.Math.Between(0, 359),
          s: Phaser.Math.FloatBetween(0.55, 0.9),
          v: Phaser.Math.FloatBetween(0.12, 0.22),
          targetV: Phaser.Math.FloatBetween(0.14, 0.2),
          white01: 0
        };

        this.cells[this.idx(row, col)] = c;
        this.apply(row, col, c);
      }
    }
  }

  private spawnBrightCells() {
    const div = this.divisions;
    const n = 45;

    for (let i = 0; i < n; i++) {
      const row = Phaser.Math.Between(0, div - 1);
      const col = Phaser.Math.Between(0, div - 1);

      const c = this.cells[this.idx(row, col)];
      c.h = Phaser.Math.Between(0, 359);
      c.s = Phaser.Math.FloatBetween(0.85, 1);
      c.targetV = Phaser.Math.FloatBetween(0.82, 0.99);
    }
  }

  private decayCells() {
    const div = this.divisions;

    for (let row = 0; row < div; row++) {
      for (let col = 0; col < div; col++) {
        const c = this.cells[this.idx(row, col)];

        c.v += (c.targetV - c.v) * 0.08;

        if (c.targetV > 0.25 && c.v > c.targetV * 0.9) {
          c.targetV = Phaser.Math.FloatBetween(0.14, 0.2);
        }

        c.white01 += (0 - c.white01) * 0.12;

        this.apply(row, col, c);
      }
    }
  }

  private redrawAll() {
    const div = this.divisions;
    for (let row = 0; row < div; row++) {
      for (let col = 0; col < div; col++) {
        this.apply(row, col, this.cells[this.idx(row, col)]);
      }
    }
    this.redrawTiles();
  }

  private startWhiteGlow() {
    const div = this.divisions;

    this.glowRow = Phaser.Math.Between(0, div - 1);
    this.glowCol = Phaser.Math.Between(0, div - 1);
    this.glowT = 0;
    this.glowDurMs = Phaser.Math.Between(600, 1100);
  }

  private tickWhiteGlow(dtMs: number) {
    if (this.glowDurMs <= 0) return;

    this.glowT += dtMs;
    const t01 = this.clamp01(this.glowT / this.glowDurMs);

    const up01 = t01 < 0.25 ? t01 / 0.25 : 1;
    const down01 = t01 < 0.25 ? 1 : 1 - (t01 - 0.25) / 0.75;
    const pulse = this.clamp01(Math.min(up01, down01));

    const div = this.divisions;

    const setW = (row: number, col: number, w01: number) => {
      if (row < 0 || col < 0 || row >= div || col >= div) return;
      const c = this.cells[this.idx(row, col)];
      c.white01 = Math.max(c.white01, w01);
    };

    setW(this.glowRow, this.glowCol, 0.95 * pulse);

    const n1 = 0.55 * pulse;
    const n2 = 0.28 * pulse;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        setW(this.glowRow + dr, this.glowCol + dc, n1);
      }
    }

    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) continue;
        if (Math.abs(dr) + Math.abs(dc) > 3) continue;
        setW(this.glowRow + dr, this.glowCol + dc, n2);
      }
    }

    if (t01 >= 1) this.glowDurMs = 0;
  }

  public startFlashing() {
    if (this.tickEv) return;

    this.initCells();
    this.redrawTiles();

    const scheduleGlow = () => {
      const delay = Phaser.Math.Between(100, 200);

      this.glowEv = this.scene?.time?.addEvent({
        delay,
        loop: false,
        callback: () => {
          if (this.destroyed) return;
          this.startWhiteGlow();
          if (!this.destroyed) scheduleGlow();
        }
      });
    };

    scheduleGlow();

    this.tickEv = this.scene?.time?.addEvent({
      delay: 220,
      loop: true,
      callback: () => {
        this.spawnBrightCells();
        this.tickWhiteGlow(220);
        this.decayCells();
        this.redrawTiles();
      }
    });
  }

  public stopFlashing() {
    this.tickEv?.remove(false);
    this.tickEv = undefined;

    this.glowEv?.remove(false);
    this.glowEv = undefined;

    this.glowDurMs = 0;

    this.hoverTween?.stop();
    this.hoverTween = undefined;

    this.hoverMul = 1;
    this.scene?.input?.setDefaultCursor("default");
  }

  public destroy(fromScene?: boolean) {
    this.stopFlashing();
    super.destroy(fromScene);
  }
}

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
      initialRightActive: boolean
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
        rightActive = v;
        redraw();
      };

      redraw();

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
    const musicToggle = makeToggle2x(toggleX, uiY, "music", "no_music", false);

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
