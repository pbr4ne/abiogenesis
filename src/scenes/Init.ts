
import Phaser from "phaser";
import { checkUrlParam, getUrlParam } from "../utilities/GameUtils";
import PlanetRunState from "../planet/PlanetRunState";

export default class Init extends Phaser.Scene {

  constructor() {
    super("Init");
  }

  create() {

    const run = new PlanetRunState(40);
    this.registry.set("run", run);

    const sceneOverride = getUrlParam("scene");
    if (sceneOverride) {
      this.scene.start(sceneOverride);
      return;
    }

    if (checkUrlParam("skipWelcome", "true")) {
      this.scene.start("Terraforming");
    } else {
      this.scene.start("Welcome");
    }

    this.events.emit("scene-awake");
  }
}


