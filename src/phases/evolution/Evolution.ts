import Phaser from "phaser";
import PhaseScene from "../../scenes/PhaseScene";
import Planet from "./EvolutionPlanet";
import LifePanel from "./LifeDetailsHover";
import LifeDetailsModal from "./LifeDetailsModal";
import { LifeFormDef, LifeFormInstance } from "./EvolutionTypes";
import EvolutionTreeModal from "./EvolutionTreeModal";
import EvolutionTreeButton from "./EvolutionTreeButton";
import PlanetRunState from "../../planet/PlanetRunState";
import EvolutionSim from "./EvolutionSim";
import AbacusPoints from "./AbacusPoints";

export default class Evolution extends PhaseScene {
  private run!: PlanetRunState;
  private planet!: Planet;
  private hoverPanel!: LifePanel;
  private modal!: LifeDetailsModal;
  private evoModal!: EvolutionTreeModal;
  private evoBtn!: EvolutionTreeButton;
  private sim!: EvolutionSim;
  private simTimer?: Phaser.Time.TimerEvent;
  private abacusPoints!: AbacusPoints;
  private lastEvoPts = -1;

  constructor() {
    super("Evolution");
  }

  protected createPhase() {
    this.planet = new Planet(this, 960, 540);
    this.add.existing(this.planet);
    this.bgCam.ignore(this.planet);

    this.run = this.registry.get("run") as PlanetRunState;

    this.abacusPoints = new AbacusPoints(this, {
      x: 250,
      y: 360,
      getPoints: (): number => this.run.getEvoPointsAvailable(),
      maxPoints: 1000,
      width: 350
    });
    this.add.existing(this.abacusPoints);

    this.sim = new EvolutionSim(this.run, 40);

    this.simTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.sim.tick();
        const pts = this.run.getEvoPointsAvailable();
        if (pts !== this.lastEvoPts) {
          this.lastEvoPts = pts;
          this.events.emit("evoPoints:changed", pts);
        }

        this.planet.refreshFromRun();
        this.abacusPoints.refresh();
        if (this.evoModal.isOpen()) this.evoModal.show(this.run.lifeForms);
      }
    });

    this.sim = new EvolutionSim(this.run, 40);

    this.simTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.sim.tick();
        this.planet.refreshFromRun();
        if (this.evoModal.isOpen()) this.evoModal.show(this.run.lifeForms);
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.simTimer?.remove(false);
      this.simTimer = undefined;
    });

    this.hoverPanel = new LifePanel(this);
    this.modal = new LifeDetailsModal(this);

    this.evoModal = new EvolutionTreeModal(this);

    this.evoBtn = new EvolutionTreeButton(this, () => {
      if (this.evoModal.isOpen()) {
        this.evoModal.hide();
        this.hoverPanel.hide();
      } else {
        this.evoModal.show(this.run.lifeForms);
      }
    });

    this.add.existing(this.evoBtn);

    this.events.on(
      "life:hoverAt",
      (e: { payload: { lf: LifeFormInstance; def: LifeFormDef }; x: number; y: number; size: number } | null) => {
        if (!e) {
          this.hoverPanel.hide();
          return;
        }

        this.hoverPanel.setLifeAt(e.payload, e.x, e.y, e.size);
      }
    );

    this.events.on("life:hover", (p: { lf: LifeFormInstance; def: LifeFormDef } | null) => {
      if (this.evoModal.isOpen()) return;
      this.hoverPanel.setLife(p);
    });

    this.events.on("life:select", (payload: { lf: LifeFormInstance; def: LifeFormDef }) => {
      this.hoverPanel.setLife(null);
      this.modal.show(payload);
    });
  }
}
