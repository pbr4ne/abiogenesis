import Phaser from "phaser";
import PhaseScene from "../../scenes/PhaseScene";
import { LifeFormType } from "./EvolutionTypes";
import { LIFEFORMS } from "./LifeForms";
import { enableDebugNext } from "../../utilities/DebugNav";

const rgbToHex = (r: number, g: number, b: number) => (r << 16) | (g << 8) | b;

export default class EvolutionComplete extends PhaseScene {
  private lfType: LifeFormType = "prokaryote";

  constructor() {
    super("EvolutionComplete");
  }

  public init(data: any) {
    const t = data?.lfType as LifeFormType | undefined;
    if (t && (t in LIFEFORMS)) this.lfType = t;
  }

  protected createPhase(): void {
    enableDebugNext({
      scene: this,
      next: "GalaxyMap"
    });
    const cx = 960;
    const cy = 540;

    const def = LIFEFORMS[this.lfType];
    const tint = rgbToHex(def.colour.r, def.colour.g, def.colour.b);

    const rocket = this.add.image(cx, cy, "rocket");
    rocket.setTintFill(tint);
    rocket.setAlpha(0);

    const windowDy = rocket.displayHeight * -0.055;
    const windowD = rocket.displayHeight * 0.195;

    const icon = this.add.image(cx, cy + windowDy, def.type);
    icon.setTintFill(tint);
    icon.setDisplaySize(windowD * 0.75, windowD * 0.75);
    icon.setAlpha(0);

    const check = this.add.image(cx, cy, "check");
    check.setTintFill(0x49d16b);
    check.setAlpha(0);
    check.disableInteractive();

    this.bgCam.ignore(rocket);
    this.bgCam.ignore(icon);
    this.bgCam.ignore(check);

    this.tweens.add({
      targets: [rocket, icon],
      alpha: 1,
      duration: 1200,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: [rocket, icon],
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
      this.scene.start("GalaxyMap", { lfType: this.lfType });
    });
  }
}
