import Phaser from "phaser";
import PhaseScene from "../../scenes/PhaseScene";

export default class EvolutionComplete extends PhaseScene {
  constructor() {
    super("EvolutionComplete");
  }

  protected createPhase(): void {
    const cx = 960;
    const cy = 540;

    const terraformed = this.add.image(cx, cy, "rocket");
    terraformed.setTintFill(0xff1cb7);
    terraformed.setAlpha(0);

    const check = this.add.image(cx, cy, "check");
    check.setTintFill(0x49d16b);
    check.setAlpha(0);
    check.disableInteractive();

    this.bgCam.ignore(terraformed);
    this.bgCam.ignore(check);

    this.tweens.add({
      targets: terraformed,
      alpha: 1,
      duration: 1200,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: terraformed,
          alpha: 0,
          duration: 700,
          delay: 300,
          ease: "Sine.easeInOut"
        });

        this.tweens.add({
          targets: check,
          alpha: 1,
          duration: 700,
          delay: 300,
          ease: "Sine.easeInOut",
          onComplete: () => {
            check.setInteractive({ useHandCursor: true });
          }
        });
      }
    });

    check.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.scene.start("GalaxyMap");
    });
  }
}
