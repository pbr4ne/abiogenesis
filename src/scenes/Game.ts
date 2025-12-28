import Phaser from "phaser";
import BaseScene from "./BaseScene";

export default class Game extends BaseScene {

	constructor() {
		super("Game");
	}

	editorCreate(): void {
        super.create();
		
		this.events.emit("scene-awake");
	}

    create() {
        this.editorCreate();
    }    
}
