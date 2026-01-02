import PhaseScene from "../scenes/PhaseScene";
import Planet from "./PrimordialSoupPlanet";
import { log } from "../utilities/GameUtils";
import DNAHelix from "../primordial/DNAHelix";
import MoleculeMeters from "./MoleculeMeters";

export default class PrimordialSoup extends PhaseScene {
  private planet!: Planet;

  constructor() {
    super("PrimordialSoup");
  }

  protected createPhase() {
    const planetHeight = 768;

    const helixX = 960 + 384 + 220;
    const helixY = 540;

    const helix = new DNAHelix(this, helixX, helixY, { height: planetHeight });
    this.add.existing(helix);
    
    this.bgCam.ignore(helix);

    this.planet = new Planet(this, 960, 540, {}, helix);
    this.add.existing(this.planet);
    this.bgCam.ignore(this.planet);

    const meters = new MoleculeMeters(this, 120, 240, this.planet.getProgress());
this.add.existing(meters);
this.bgCam.ignore(meters);


    helix.setProgress(this.planet.getProgress());


    this.planet.startSoup();

    log("PrimordialSoup scene created");
  }
}
