import Phaser from "phaser";
import { checkUrlParam, getUrlParam } from "../utilities/GameUtils";
import { getRun } from "../utilities/GameSession";
import { Audio } from "../utilities/GameSounds";

export default class Init extends Phaser.Scene {
  constructor() {
    super("Init");
  }

  create() {
    getRun();

    Audio.init(this.sys.game);
    Audio.setSoundEnabled(true);

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
