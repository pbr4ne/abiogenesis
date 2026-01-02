import PhaseScene from "../scenes/PhaseScene";
import Planet from "./PrimordialSoupPlanet";
import { log } from "../utilities/GameUtils";
import DNAHelix from "../primordial/DNAHelix";

export default class PrimordialSoup extends PhaseScene {
  private planet!: Planet;

  constructor() {
    super("PrimordialSoup");
  }

  protected createPhase() {
    this.planet = new Planet(this, 960, 540);
    this.add.existing(this.planet);
    this.bgCam.ignore(this.planet);

    const planetHeight = 768;

    const helixX = 960 + 384 + 220;
    const helixY = 540;

    const helix = new DNAHelix(this, helixX, helixY, {
      height: planetHeight
    });

    this.add.existing(helix);
    this.bgCam.ignore(helix);

    this.planet.startSoup();

    log("PrimordialSoup scene created");
  }
}
