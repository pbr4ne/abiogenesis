import PhaseScene from "../../scenes/PhaseScene";
import Planet from "./PrimordialSoupPlanet";
import { log } from "../../utilities/GameUtils";
import DNAHelix from "./DNAHelix";
import Nucleotides from "./Nucleotides";
import Phaser from "phaser";
import { enableSkipPhase } from "../../utilities/SkipPhase";
import { getRun } from "../../utilities/GameSession";
import { Audio } from "../../utilities/GameSounds";

type BaseKey = "A" | "C" | "G" | "T";

const NUCLEOTIDE_SFX: Record<BaseKey, string> = {
  A: "Adenine",
  C: "Cytosine",
  G: "Guanine",
  T: "Thymine",
};

export default class PrimordialSoup extends PhaseScene {
  private planet!: Planet;
  private didComplete = false;

  private didNucleotideSfx: Record<BaseKey, boolean> = { A: false, C: false, G: false, T: false };

  constructor() {
    super("PrimordialSoup");
  }

  protected createPhase() {
    Audio.init(this.sys.game);
    Audio.playMusic("primordial_music", { loop: true });
    this.onShutdown(() => Audio.stopMusicIfKey("primordial_music"));

    const run = getRun();
    run.waterLevel = Math.max(run.waterLevel, 10);

    enableSkipPhase({
      scene: this,
      next: "PrimordialSoupComplete"
    });

    this.didComplete = false;
    this.didNucleotideSfx = { A: false, C: false, G: false, T: false };

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

  private checkNucleotideCompleteSfx() {
    const progress = this.planet.getProgress();
    const gatc = progress.getGATC01();

    const COMPLETE_AT = 0.999;

    for (const k of ["A", "C", "G", "T"] as const) {
      if (this.didNucleotideSfx[k]) continue;
      if ((gatc[k] ?? 0) < COMPLETE_AT) continue;

      this.didNucleotideSfx[k] = true;

      Audio.playExclusiveSfx(NUCLEOTIDE_SFX[k]);
    }
  }

  private checkComplete() {
    this.checkNucleotideCompleteSfx();

    if (this.didComplete) return;

    const progress = this.planet.getProgress();
    if (!progress.isEffectivelyComplete()) return;

    this.didComplete = true;

    this.time.delayedCall(5000, () => {
      this.scene.start("PrimordialSoupComplete");
    });
  }
}
