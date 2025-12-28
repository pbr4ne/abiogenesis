import Phaser from "phaser";
import BaseScene from "./BaseScene";
import Planet from "../prefabs/Planet";
import { log } from "../utilities/GameUtils";
import { createStarfield, Starfield } from "../utilities/StarField";
import ColourButton from "../prefabs/LifeButton";

export default class Game extends BaseScene {
  constructor() {
    super("Game");
  }

  public planet!: Planet;

  private bgCam!: Phaser.Cameras.Scene2D.Camera;
  private gameCam!: Phaser.Cameras.Scene2D.Camera;

  private starfield!: Starfield;

  private selectedColourHex: string | null = null;
  private colourButtons: ColourButton[] = [];

  editorCreate(): void {
    super.create();
    this.events.emit("scene-awake");
  }

  private layoutCameras() {
    const designW = 1920;
    const designH = 1080;

    const w = this.scale.width;
    const h = this.scale.height;

    const scale = Math.min(w / designW, h / designH);

    const viewW = Math.floor(designW * scale);
    const viewH = Math.floor(designH * scale);

    const viewX = Math.floor((w - viewW) / 2);
    const viewY = Math.floor((h - viewH) / 2);

    this.bgCam.setViewport(0, 0, w, h);

    this.gameCam.setViewport(viewX, viewY, viewW, viewH);
    this.gameCam.setZoom(scale);
    this.gameCam.centerOn(designW / 2, designH / 2);
  }

  private setSelectedColour(hex: string) {
    this.selectedColourHex = hex;
    for (const b of this.colourButtons) b.setSelected(b.colourHex === hex);
  }

  private createLifeButtons() {
    const x = 260;
    const y0 = 420;
    const gap = 64;

    const defs = [
      { label: "CARNIVORE", colourHex: "#ff3b3b" },
      { label: "PLANT", colourHex: "#2ecc71" },
      { label: "HERBIVORE", colourHex: "#3498ff" }
    ];

    this.colourButtons = defs.map((d, i) => {
      const b = new ColourButton(this, x, y0 + i * gap, d);
      this.add.existing(b);
      this.bgCam.ignore(b);

      b.on("selected", (hex: string) => this.setSelectedColour(hex));
      return b;
    });

    this.setSelectedColour(defs[0].colourHex);
  }

  create() {
    this.editorCreate();

    log("Game create");

    this.bgCam = this.cameras.main;
    this.bgCam.setScroll(0, 0);

    this.gameCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.gameCam.setScroll(0, 0);

    this.starfield = createStarfield(this, this.bgCam, this.gameCam);

    this.planet = new Planet(this, 960, 540);
    this.add.existing(this.planet);
    this.bgCam.ignore(this.planet);

    this.createLifeButtons();

    this.planet.onPlanetPointerDown((pointer: Phaser.Input.Pointer) => {
      if (!this.selectedColourHex) return;

      const p = pointer.positionToCamera(this.gameCam) as Phaser.Math.Vector2;
      this.planet.paintAtPoint(p.x, p.y, this.selectedColourHex);
    });

    this.layoutCameras();

    this.scale.on("resize", () => {
      this.layoutCameras();
      this.starfield.rebuild();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.starfield.destroy();
    });
  }
}
