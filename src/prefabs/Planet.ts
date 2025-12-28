
import { log } from "../utilities/GameUtils";

export default class Planet extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene) {
		super(scene);

		log("Planet constructor");

		const ellipse = new Phaser.GameObjects.Ellipse(scene, 0, 0, 512, 512, 0xffffff);
		this.add(ellipse);
	}
}
