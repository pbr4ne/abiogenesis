import Phaser from "phaser";
import PreloadBarUpdaterScript from "../script-nodes/ui/PreloadBarUpdaterScript";
import assetPackUrl from "../../static/assets/asset-pack.json";
import WebFont from 'webfontloader';
import { log } from "../utilities/GameUtils";

export default class Preload extends Phaser.Scene {
  private loadingText?: Phaser.GameObjects.Text;
  private progressBarBg?: Phaser.GameObjects.Rectangle;
  private progressBar?: Phaser.GameObjects.Rectangle;

  constructor() {
    super("Preload");
  }

  private layout(): void {
    if (!this.loadingText || !this.progressBarBg || !this.progressBar) {
      return;
    }
    if (!this.loadingText.active || !this.progressBarBg.active || !this.progressBar.active) {
      return;
    }

    const w = this.scale.width;
    const h = this.scale.height;

    const textWidth = this.loadingText.width;
    const barWidth = textWidth;
    const barHeight = 20;

    this.loadingText.setPosition(w / 2, h / 2 - 24);

    this.progressBarBg.setSize(barWidth, barHeight);
    this.progressBarBg.setPosition(w / 2 - barWidth / 2, h / 2);

    this.progressBar.setSize(barWidth, barHeight);
    this.progressBar.setPosition(w / 2 - barWidth / 2, h / 2);
  }

  editorCreate(): void {
    this.loadingText = this.add.text(0, 0, "Loading...", {
      color: "#ff00ff",
      fontFamily: '"Courier New", monospace',
      fontSize: "25px",
      strokeThickness: 2,
      stroke: "#ff00ff",
    });
    this.loadingText.setOrigin(0.5, 0.5);

    this.progressBarBg = this.add.rectangle(0, 0, 10, 20);
    this.progressBarBg.setOrigin(0, 0);
    this.progressBarBg.fillColor = 0x000000;
    this.progressBarBg.isStroked = true;
    this.progressBarBg.strokeColor = 0x000000;

    this.progressBar = this.add.rectangle(0, 0, 10, 20);
    this.progressBar.setOrigin(0, 0);
    this.progressBar.isFilled = true;
    this.progressBar.fillColor = 0xff00ff;

    new PreloadBarUpdaterScript(this.progressBar);

    this.layout();
    this.scale.on("resize", this.layout, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.layout, this);
    });

    this.events.emit("scene-awake");
  }

  async preload(): Promise<void> {
    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

    WebFont.load({
      google: {
        families: ['Press Start 2P'],
      },
      active: () => {
        if (!this.loadingText) {
          this.editorCreate();
        } else {
          this.layout();
        }
      },
    });

    this.load.pack("asset-pack", assetPackUrl);

    log("PRELOAD COMPLETE");
  }

  create(): void {
    this.loadFonts(() => {
      this.scene.start("Init");
    });
  }

  private loadFonts(callback: () => void): void {
    WebFont.load({
      google: {
        families: ["Press Start 2P"],
      },
      active: callback,
      inactive: () => {
        console.error("Failed to load fonts");
        callback();
      },
    });
  }
}
