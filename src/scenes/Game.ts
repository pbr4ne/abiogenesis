import Phaser from "phaser";
import BaseScene from "./BaseScene";
import Planet from "../prefabs/Planet";
import { log } from "../utilities/GameUtils";

export default class Game extends BaseScene {

	constructor() {
		super("Game");
	}

	public planet!: Planet;

	editorCreate(): void {
        super.create();
		
		this.events.emit("scene-awake");
	}

	create() {
		this.editorCreate();

		log("Game create");
		this.planet = new Planet(this);
		this.add.existing(this.planet);
	}
}
