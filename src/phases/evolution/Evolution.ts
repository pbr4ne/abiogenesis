import PhaseScene from "../../scenes/PhaseScene";
import Planet from "./EvolutionPlanet";
import LifePanel from "./LifePanel";
import { LifeFormDef, LifeFormInstance } from "./EvolutionTypes";

export default class Evolution extends PhaseScene {
  private planet!: Planet;
  private hoverPanel!: LifePanel;

  constructor() {
    super("Evolution");
  }

  protected createPhase() {
    this.planet = new Planet(this, 960, 540);
    this.add.existing(this.planet);
    this.bgCam.ignore(this.planet);

    this.hoverPanel = new LifePanel(this);

    this.events.on("life:hover", (payload: { lf: LifeFormInstance; def: LifeFormDef } | null) => {
      this.hoverPanel.setLife(payload);
    });
  }
}
