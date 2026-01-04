import PhaseScene from "../../scenes/PhaseScene";
import Planet from "./EvolutionPlanet";
import LifePanel from "./LifeDetailsHover";
import LifeDetailsModal from "./LifeDetailsModal";
import { LifeFormDef, LifeFormInstance } from "./EvolutionTypes";

export default class Evolution extends PhaseScene {
  private planet!: Planet;
  private hoverPanel!: LifePanel;
  private modal!: LifeDetailsModal;

  constructor() {
    super("Evolution");
  }

  protected createPhase() {
    this.planet = new Planet(this, 960, 540);
    this.add.existing(this.planet);
    this.bgCam.ignore(this.planet);

    this.hoverPanel = new LifePanel(this);
    this.modal = new LifeDetailsModal(this);

    this.events.on("life:hover", (payload: { lf: LifeFormInstance; def: LifeFormDef } | null) => {
      if (!this.modal.isOpen()) this.hoverPanel.setLife(payload);
    });

    this.events.on("life:select", (payload: { lf: LifeFormInstance; def: LifeFormDef }) => {
      this.hoverPanel.setLife(null);
      this.modal.show(payload);
    });
  }
}
