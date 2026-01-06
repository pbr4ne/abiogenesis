import Phaser from "phaser";
import BaseScene from "./BaseScene";
import { createStarfield, Starfield } from "../utilities/StarField";
import PhaseBreadcrumb from "./PhaseBreadcrumb";

const DESIGN_W = 1920;
const DESIGN_H = 1080;

export type PhaseKey = "Terraforming" | "TerraformingComplete" | "PrimordialSoup" | "PrimordialSoupComplete" | "Evolution" | "EvolutionComplete" | "GalaxyMap";

const PHASES: readonly PhaseKey[] = ["Terraforming", "TerraformingComplete", "PrimordialSoup", "PrimordialSoupComplete", "Evolution", "EvolutionComplete", "GalaxyMap"];

export default abstract class PhaseScene extends BaseScene {
  protected bgCam!: Phaser.Cameras.Scene2D.Camera;
  protected gameCam!: Phaser.Cameras.Scene2D.Camera;

  protected starfield!: Starfield;

  private readonly phaseKey: PhaseKey;
  private breadcrumb?: PhaseBreadcrumb;

  constructor(phaseKey: PhaseKey) {
    super(phaseKey);
    this.phaseKey = phaseKey;
  }

  public create() {
    super.create();

    this.setupCameras();
    this.starfield = createStarfield(this, this.bgCam, this.gameCam);

    this.createPhase();

    this.breadcrumb = new PhaseBreadcrumb(this, 40, 70, this.getPhaseGroup(), this.getPhaseActiveColor());
    this.add.existing(this.breadcrumb);
    this.bgCam.ignore(this.breadcrumb);

    this.onShutdown(() => {
      this.breadcrumb?.destroy();
      this.breadcrumb = undefined;
    });

    this.events.on("ui:nextPhase", this.onNextPhase);
    this.events.on("ui:prevPhase", this.onPrevPhase);

    this.onShutdown(() => {
      this.starfield.destroy();
      this.events.off("ui:nextPhase", this.onNextPhase);
      this.events.off("ui:prevPhase", this.onPrevPhase);
    });
  }

  public setBreadcrumbVisible(v: boolean) {
    this.breadcrumb?.setVisible(v);
  }

  private getPhaseActiveColor(): number {
    switch (this.phaseKey) {
      case "Terraforming":
      case "TerraformingComplete":
        return 0x8fd3ff;

      case "PrimordialSoup":
      case "PrimordialSoupComplete":
        return 0xf5b942;

      case "Evolution":
      case "EvolutionComplete":
        return 0xff1cb7;

      case "GalaxyMap":
        return 0xffd27f;
    }
  }

  private getPhaseGroup(): "planet" | "dna" | "dolphin" | "system" {
    switch (this.phaseKey) {
      case "Terraforming":
      case "TerraformingComplete":
        return "planet";

      case "PrimordialSoup":
      case "PrimordialSoupComplete":
        return "dna";

      case "Evolution":
      case "EvolutionComplete":
        return "dolphin";

      case "GalaxyMap":
        return "system";
    }
  }

  protected abstract createPhase(): void;

  protected setupCameras() {
    this.bgCam = this.cameras.main;
    this.bgCam.setViewport(0, 0, DESIGN_W, DESIGN_H);
    this.bgCam.setScroll(0, 0);

    this.gameCam = this.cameras.add(0, 0, DESIGN_W, DESIGN_H);
    this.gameCam.setScroll(0, 0);
    this.gameCam.setZoom(1);
    this.gameCam.centerOn(DESIGN_W / 2, DESIGN_H / 2);
  }

  private onNextPhase = () => {
    this.scene.start(this.getPhaseByOffset(1));
  };

  private onPrevPhase = () => {
    this.scene.start(this.getPhaseByOffset(-1));
  };

  private getPhaseByOffset(offset: number): PhaseKey {
    const i = PHASES.indexOf(this.phaseKey);
    const base = i >= 0 ? i : 0;

    const next = (base + offset + PHASES.length) % PHASES.length;
    return PHASES[next];
  }
}
