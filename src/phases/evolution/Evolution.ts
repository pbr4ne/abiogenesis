import PhaseScene from "../../scenes/PhaseScene";
import Planet from "./EvolutionPlanet";
import LifePanel from "./LifeDetailsHover";
import LifeDetailsModal from "./LifeDetailsModal";
import { LifeFormDef, LifeFormInstance } from "./EvolutionTypes";
import EvolutionTreeModal from "./EvolutionTreeModal";
import EvolutionTreeButton from "./EvolutionTreeButton";
import PlanetRunState from "../../planet/PlanetRunState";

export default class Evolution extends PhaseScene {
  private run!: PlanetRunState;
  private planet!: Planet;
  private hoverPanel!: LifePanel;
  private modal!: LifeDetailsModal;
  private evoModal!: EvolutionTreeModal;
  private evoBtn!: EvolutionTreeButton;

  constructor() {
    super("Evolution");
  }

  protected createPhase() {
    this.planet = new Planet(this, 960, 540);
    this.add.existing(this.planet);
    this.bgCam.ignore(this.planet);

    this.run = this.registry.get("run") as PlanetRunState;

    this.hoverPanel = new LifePanel(this);
    this.modal = new LifeDetailsModal(this);

    this.evoModal = new EvolutionTreeModal(this);

    this.evoBtn = new EvolutionTreeButton(this, () => {
      if (this.evoModal.isOpen()) this.evoModal.hide();
      else this.evoModal.show(this.run.lifeForms);
    });

    this.add.existing(this.evoBtn);

    this.events.on("life:hover", (payload: { lf: LifeFormInstance; def: LifeFormDef } | null) => {
      if (!this.modal.isOpen()) this.hoverPanel.setLife(payload);
    });

    this.events.on("life:select", (payload: { lf: LifeFormInstance; def: LifeFormDef }) => {
      this.hoverPanel.setLife(null);
      this.modal.show(payload);
    });
  }
}
