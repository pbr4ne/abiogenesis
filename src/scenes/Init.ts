
import Phaser from "phaser";
import { checkUrlParam } from "../utilities/GameUtils";

export default class Init extends Phaser.Scene {

  constructor() {
    super("Init");
  }

  create() {

    if (checkUrlParam("skipWelcome", "true")) {
      this.scene.start("Terraforming");
    } else {
      this.scene.start("Welcome");
    }

    this.events.emit("scene-awake");
  }
}


