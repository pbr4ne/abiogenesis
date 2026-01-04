import { log } from "../../utilities/GameUtils";
import PhaseScene from "../../scenes/PhaseScene";
import Planet from "./EvolutionPlanet";
import { LifeFormDef, LifeFormInstance } from "./EvolutionTypes";

export default class Evolution extends PhaseScene {
  private planet!: Planet;

  constructor() {
    super("Evolution");
  }

  protected createPhase() {
    this.planet = new Planet(this, 960, 540);
    this.add.existing(this.planet);
    this.bgCam.ignore(this.planet);

    this.createLifeInfoPanel();
    this.listenForLifeHover();
  }

  private infoBg!: Phaser.GameObjects.Rectangle;
  private infoText!: Phaser.GameObjects.Text;

  private listenForLifeHover() {
    this.events.on("life:hover", (payload: { lf: LifeFormInstance; def: LifeFormDef } | null) => {
      if (!payload) {
        this.infoBg.setVisible(false);
        this.infoText.setVisible(false);
        return;
      }

      const { lf, def } = payload;

      const habitats = def.habitats.join(", ");
      const mutates = def.mutatesTo.length ? def.mutatesTo.join(", ") : "none";

      this.infoText.setText(
        [
          `${def.type.toUpperCase()}`,
          ``,
          `Habitat: ${habitats}`,
          `Rarity: ${def.rarity}`,
          `Mutates to: ${mutates}`,
          ``,
          `Mutation: ${lf.mutationRate}/10`,
          `Reproduction: ${lf.reproductionRate}/10`,
          `Survival: ${lf.survivalRate}/10`,
          ``,
          `Cell: (${lf.row}, ${lf.col})`
        ].join("\n")
      );

      this.infoBg.setVisible(true);
      this.infoText.setVisible(true);
    });
  }

  private createLifeInfoPanel() {
    const w = 360;
    const h = 260;
    const pad = 16;

    const x = this.scale.width - w / 2 - 24;
    const y = 180;

    this.infoBg = this.add.rectangle(x, y, w, h, 0x0b0b0b, 0.75);
    this.infoBg.setStrokeStyle(2, 0xffffff, 0.2);
    this.infoBg.setScrollFactor(0);

    this.infoText = this.add.text(x - w / 2 + pad, y - h / 2 + pad, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      wordWrap: { width: w - pad * 2 }
    });
    this.infoText.setScrollFactor(0);

    this.infoBg.setVisible(false);
    this.infoText.setVisible(false);
  }
}
