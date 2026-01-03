import { log } from "../../utilities/GameUtils";
import PhaseScene from "../../scenes/PhaseScene";
import Planet from "./EvolutionPlanet";

export default class Evolution extends PhaseScene {
  private planet!: Planet;

  constructor() {
    super("Evolution");
  }

  protected createPhase() {
    this.planet = new Planet(this, 960, 540);
    this.add.existing(this.planet);
    this.bgCam.ignore(this.planet);

    log("Evolution scene created");
  }
}
