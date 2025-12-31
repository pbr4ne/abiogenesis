import Phaser from "phaser";
import BaseScene from "./BaseScene";
import Planet from "../prefabs/Planet";
import { log } from "../utilities/GameUtils";
import { createStarfield, Starfield } from "../utilities/StarField";
import Atmosphere from "../prefabs/Atmosphere";
import Magnetosphere from "../prefabs/Magnetosphere";

export default class Game extends BaseScene {
  constructor() {
    super("Game");
  }

  public planet!: Planet;

  private bgCam!: Phaser.Cameras.Scene2D.Camera;
  private gameCam!: Phaser.Cameras.Scene2D.Camera;

  private starfield!: Starfield;

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


    // const planetEdge = new PlanetEdge(this, 2600, -100, { diameter: 2200, capRatio: 0.62 });
    // this.add.existing(planetEdge);
    // this.bgCam.ignore(planetEdge);

    const atmosphere = new Atmosphere(this, 960, 1200, {
      diameter: 2200,
      offsetRatio: 0.62,
      arcStartDeg: 225,
      arcEndDeg: 315,
      radiusOffset: 54,
    });
    this.add.existing(atmosphere);
    this.bgCam.ignore(atmosphere);

    const magnetosphere = new Magnetosphere(this, 960, -120, {
      diameter: 2200,
      offsetRatio: 0.62,
      arcStartDeg: 45,
      arcEndDeg: 135,
      radiusOffset: 54,
    });
    this.add.existing(magnetosphere);
    this.bgCam.ignore(magnetosphere);

    atmosphere.setVisible(false);
    magnetosphere.setVisible(false);
    this.planet.setVisible(true);

    this.events.on("ui:goToPlanet", () => {
      atmosphere.setVisible(false);
      magnetosphere.setVisible(false);
      this.planet.setVisible(true);
    });

    this.events.on("ui:goToAtmosphere", () => {
      this.planet.setVisible(false);
      magnetosphere.setVisible(false);
      atmosphere.setVisible(true);
    });

    this.events.on("ui:goToMagnetosphere", () => {
      this.planet.setVisible(false);
      atmosphere.setVisible(false);
      magnetosphere.setVisible(true);
    });

    this.layoutCameras();

    this.scale.on("resize", () => {
      this.layoutCameras();
      this.starfield.rebuild();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.starfield.destroy();
      this.events.off("ui:goToPlanet");
      this.events.off("ui:goToAtmosphere");
      this.events.off("ui:goToMagnetosphere");
    });
  }
}
