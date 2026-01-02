import Phaser from "phaser";

export default class BaseScene extends Phaser.Scene {
  constructor(sceneKey: string) {
    super(sceneKey);
  }

  public create() {
  }

  protected onShutdown(cb: () => void) {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cb);
  }
}
