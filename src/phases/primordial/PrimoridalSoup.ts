import PhaseScene from "../../scenes/PhaseScene";
import Planet from "./PrimordialSoupPlanet";
import { log } from "../../utilities/GameUtils";
import DNAHelix from "./DNAHelix";
import Nucleotides from "./Nucleotides";
import Phaser from "phaser";
import { enableDebugNext } from "../../utilities/DebugNav";

export default class PrimordialSoup extends PhaseScene {
  private planet!: Planet;
  private didComplete = false;

  constructor() {
    super("PrimordialSoup");
  }

  protected createPhase() {
    enableDebugNext({
      scene: this,
      next: "PrimordialSoupComplete"
    });

    const planetHeight = 768;

    const helixX = 960 + 384 + 220;
    const helixY = 540;

    const helix = new DNAHelix(this, helixX, helixY, { height: planetHeight });
    this.add.existing(helix);

    this.bgCam.ignore(helix);

    this.planet = new Planet(this, 960, 540);
    this.add.existing(this.planet);
    this.bgCam.ignore(this.planet);

    const meters = new Nucleotides(this, 120, 240, this.planet.getProgress());
    this.add.existing(meters);
    this.bgCam.ignore(meters);

    helix.setProgress(this.planet.getProgress());

    this.planet.startSoup();

    this.events.on(Phaser.Scenes.Events.UPDATE, this.checkComplete, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.UPDATE, this.checkComplete, this);
    });

    log("PrimordialSoup scene created");
  }

  private checkComplete() {
    if (this.didComplete) return;

    const progress = this.planet.getProgress();
    if (!progress.isEffectivelyComplete()) return;

    this.didComplete = true;

    this.time.delayedCall(5000, () => {
      this.scene.start("PrimordialSoupComplete");
    });
  }
}
