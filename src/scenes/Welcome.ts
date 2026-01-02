import Phaser from "phaser";
import { StartSceneActionScript } from "@phaserjs/editor-scripts-core";
import { OnEventScript } from "@phaserjs/editor-scripts-core";
import { ExecActionScript } from "@phaserjs/editor-scripts-core";
import { OnPointerDownScript } from "@phaserjs/editor-scripts-core";
import { PushActionScript } from "@phaserjs/editor-scripts-simple-animations";
import BaseScene from "./BaseScene";


export default class Welcome extends BaseScene {
  private playBtn!: Phaser.GameObjects.Text;

  constructor() {
    super("Welcome");
  }

  private layout(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.playBtn.setPosition(w / 2, h / 2);
  }

  editorCreate(): void {
    super.create();

    this.playBtn = this.add.text(0, 0, "Play Abiogenesis, Inc.", {
      color: "#ffffffff",
      fontFamily: '"Courier New", monospace',
      fontSize: "25px",
      strokeThickness: 2,
      stroke: "#ffffffff",
    });
    this.playBtn.setOrigin(0.5, 0.5);
    this.playBtn.setInteractive({ useHandCursor: true });

    const onPointerDownScript = new OnPointerDownScript(this.playBtn);
    const pushActionScript = new PushActionScript(onPointerDownScript);
    const startGameAction = new StartSceneActionScript(pushActionScript);

    const onKeydown_SPACE = new OnEventScript(this);
    const startGame_SPACE = new ExecActionScript(onKeydown_SPACE);
    const onKeydown_ENTER = new OnEventScript(this);
    const startGame_ENTER = new ExecActionScript(onKeydown_ENTER);

    onKeydown_SPACE.eventName = "keydown-SPACE";
    onKeydown_SPACE.eventEmitter = "scene.input.keyboard";
    startGame_SPACE.targetAction = startGameAction;

    onKeydown_ENTER.eventName = "keydown-ENTER";
    onKeydown_ENTER.eventEmitter = "scene.input.keyboard";
    startGame_ENTER.targetAction = startGameAction;

    startGameAction.sceneKey = "Terraforming";

    this.layout();
    this.scale.on("resize", this.layout, this);

    this.events.emit("scene-awake");
  }

  create(): void {
    this.editorCreate();
  }
}
