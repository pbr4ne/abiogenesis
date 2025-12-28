import Phaser from "phaser";
import BaseScene from "./BaseScene";
import Planet from "../prefabs/Planet";
import { log } from "../utilities/GameUtils";

export default class Game extends BaseScene {

  constructor() {
    super("Game");
  }

  public planet!: Planet;

  private bgCam!: Phaser.Cameras.Scene2D.Camera;
  private gameCam!: Phaser.Cameras.Scene2D.Camera;

  private starLayers: Phaser.GameObjects.Graphics[] = [];

  editorCreate(): void {
    super.create();
    
    this.events.emit("scene-awake");
  }

  private createStarLayer(count: number, minR: number, maxR: number, alpha: number, depth: number) {
    const g = this.add.graphics();
    g.setDepth(depth);
    g.setScrollFactor(0);

    const w = this.scale.width;
    const h = this.scale.height;

    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.FloatBetween(0, w);
      const y = Phaser.Math.FloatBetween(0, h);
      const r = Phaser.Math.FloatBetween(minR, maxR);

      g.fillStyle(0xffffff, alpha);
      g.fillCircle(x, y, r);
    }

    return g;
  }

  private buildStars() {
    for (const layer of this.starLayers) {
      layer.destroy();
    }

    this.starLayers = [
      this.createStarLayer(200, 0.5, 1.2, 0.25, -1002),
      this.createStarLayer(140, 1.0, 2.0, 0.55, -1001),
      this.createStarLayer(70, 1.5, 2.0, 0.9, -1000),
    ];

    for (const layer of this.starLayers) {
      this.gameCam.ignore(layer);
    }
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

  create() {
    this.editorCreate();

    log("Game create");

    this.bgCam = this.cameras.main;
    this.bgCam.setScroll(0, 0);

    this.gameCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.gameCam.setScroll(0, 0);

    this.buildStars();

    this.planet = new Planet(this, 960, 540);
    this.add.existing(this.planet);
    this.bgCam.ignore(this.planet);

    this.layoutCameras();

    this.scale.on("resize", () => {
      this.layoutCameras();
      this.buildStars();
    });
  }
}
