import PhaseScene from "./PhaseScene";
import Planet from "../prefabs/PrimordialSoupPlanet";
import { log } from "../utilities/GameUtils";

export default class PrimordialSoup extends PhaseScene {
	private planet!: Planet;

	constructor() {
		super("PrimordialSoup");
	}

	protected createPhase() {
		this.planet = new Planet(this, 960, 540);
    this.add.existing(this.planet);
    this.bgCam.ignore(this.planet);


    log('PrimordialSoup scene created');
	}
}
