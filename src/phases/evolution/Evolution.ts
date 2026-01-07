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
import EvolutionTop3Hud from "./EvolutionTop3Hud";
import EvolutionCometButton from "./EvolutionCometButton";

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
  private cometBtn!: EvolutionCometButton;

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
          this.cometBtn.refresh();
        }

        this.planet.refreshFromRun();
        this.abacusPoints.refresh();
        if (this.evoModal.isOpen()) this.evoModal.show(this.run.lifeForms);
      }
    });

    const topHud = new EvolutionTop3Hud(this, () => this.run.lifeForms);

    this.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => topHud.refresh()
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
        this.cometBtn.setHiddenForMainHover(false);
      } else {
        this.evoModal.show(this.run.lifeForms);
        this.cometBtn.refresh();
      }
    });

    this.add.existing(this.evoBtn);

    this.cometBtn = new EvolutionCometButton({
      scene: this,
      getPoints: () => this.run.getEvoPointsAvailable(),
      minPointsToShow: 5,
      onClick: () => { }
    });
    this.add.existing(this.cometBtn);

    this.cometBtn.refresh();

    const layoutComet = () => {
      const pad = 22;
      const size = 200;
      this.cometBtn.setDisplaySize(size, size);
      this.cometBtn.setPosition(this.scale.width - pad - size / 2 - 200, this.scale.height / 2 - 50);
    };

    layoutComet();
    this.scale.on(Phaser.Scale.Events.RESIZE, layoutComet);

    this.cometBtn.on("pointerdown", () => {
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, layoutComet);
    });

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
      this.cometBtn.setHiddenForMainHover(!!p);
    });

    this.events.on("life:select", (payload: { lf: LifeFormInstance; def: LifeFormDef }) => {
      this.hoverPanel.setLife(null);
      this.cometBtn.setHiddenForMainHover(false);
      this.modal.show(payload);
    });
  }
}
