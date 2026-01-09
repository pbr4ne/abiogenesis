import Phaser from "phaser";
import Planet from "./TerraformingPlanet";
import Atmosphere from "./Atmosphere";
import Magnetosphere from "./Magnetosphere";
import PhaseScene from "../../scenes/PhaseScene";
import Hydrosphere from "./Hydrosphere";
import Core from "./Core";
import TerraformingPlanet from "./TerraformingPlanet";
import { getTerraforming } from "./getTerraformingState";
import { enableDebugNext } from "../../utilities/DebugNav";
import { Audio } from "../../utilities/GameSounds";
import { log } from "../../utilities/GameUtils";

export default class Terraforming extends PhaseScene {
  public planet!: Planet;

  constructor() {
    super("Terraforming");
  }

  protected createPhase() {
    Audio.init(this.sys.game);
    Audio.playMusic("terraforming_music", { loop: true, volume: 0.2 });
    this.onShutdown(() => Audio.stopMusicIfKey("terraforming_music"));

    enableDebugNext({
      scene: this,
      next: "TerraformingComplete"
    });

    const tf = getTerraforming(this);

    const SFX_BY_KEY = {
      atmosphere: "Atmosphere",
      magnetosphere: "Magnetosphere",
      hydrosphere: "Hydrosphere",
      core: "Core",
    } as const;

    const onReachedMax = (k: "atmosphere" | "magnetosphere" | "hydrosphere" | "core") => {
      log(`
        Terraforming: ${k} reached max level!`)
        log(`Playing SFX: ${SFX_BY_KEY[k]}`);
      Audio.playExclusiveSfx(SFX_BY_KEY[k], { volume: 0.5 });
    };

    tf.on("reachedMax", onReachedMax);
    this.onShutdown(() => tf.off("reachedMax", onReachedMax));

    let transitioning = false;

    const tryComplete = () => {
      if (transitioning) return;
      if (!tf.isComplete()) return;

      transitioning = true;

      this.time.delayedCall(3000, () => {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once(
          Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
          () => {
            this.scene.start("TerraformingComplete");
          }
        );
      });
    };

    tf.on("maybeComplete", tryComplete);
    this.onShutdown(() => tf.off("maybeComplete", tryComplete));

    this.planet = new TerraformingPlanet(this, 960, 540);

    this.add.existing(this.planet);
    this.bgCam.ignore(this.planet);

    const atmosphere = new Atmosphere(this, 960, 1200, {
      diameter: 2200,
      offsetRatio: 0.62,
      arcStartDeg: 225,
      arcEndDeg: 315,
      radiusOffset: 40,
    });
    this.add.existing(atmosphere);
    this.bgCam.ignore(atmosphere);

    const magnetosphere = new Magnetosphere(this, 960, -120, {
      diameter: 2200,
      offsetRatio: 0.62,
      arcStartDeg: 45,
      arcEndDeg: 135,
      radiusOffset: 40,
    });
    this.add.existing(magnetosphere);
    this.bgCam.ignore(magnetosphere);

    const hydrosphere = new Hydrosphere(this, 960, 540);
    this.add.existing(hydrosphere);
    this.bgCam.ignore(hydrosphere);

    const core = new Core(this, 960, 540);
    this.add.existing(core);
    this.bgCam.ignore(core);

    const setView = (v: "planet" | "atmo" | "mag" | "hydro" | "core") => {
      const onPlanet = v === "planet";

      this.setBreadcrumbVisible(onPlanet);

      atmosphere.setVisible(v === "atmo");
      magnetosphere.setVisible(v === "mag");
      hydrosphere.setVisible(v === "hydro");
      core.setVisible(v === "core");
      this.planet.setVisible(onPlanet);
    };

    setView("planet");

    const onGoToPlanet = () => setView("planet");
    const onGoToAtmosphere = () => setView("atmo");
    const onGoToMagnetosphere = () => setView("mag");
    const onGoToHydrosphere = () => setView("hydro");
    const onGoToCore = () => setView("core");

    this.events.on("ui:goToPlanet", onGoToPlanet);
    this.events.on("ui:goToAtmosphere", onGoToAtmosphere);
    this.events.on("ui:goToMagnetosphere", onGoToMagnetosphere);
    this.events.on("ui:goToHydrosphere", onGoToHydrosphere);
    this.events.on("ui:goToCore", onGoToCore);

    this.onShutdown(() => {
      this.events.off("ui:goToPlanet", onGoToPlanet);
      this.events.off("ui:goToAtmosphere", onGoToAtmosphere);
      this.events.off("ui:goToMagnetosphere", onGoToMagnetosphere);
      this.events.off("ui:goToHydrosphere", onGoToHydrosphere);
      this.events.off("ui:goToCore", onGoToCore);
    });
  }
}
