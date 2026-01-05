import Planet from "./TerraformPlanet";
import Atmosphere from "./Atmosphere";
import Magnetosphere from "./Magnetosphere";
import PhaseScene from "../../scenes/PhaseScene";
import Hydrosphere from "./Hydrosphere";
import { getTerraformingState } from "./TerraformingState";
import TerraformPlanet from "./TerraformPlanet";
import { log } from "../../utilities/GameUtils";
import { getTerraforming } from "./getTerraformingState";


export default class Terraforming extends PhaseScene {
  public planet!: Planet;

  constructor() {
    super("Terraforming");
  }

  protected createPhase() {
    const tf = getTerraforming(this);

    let transitioning = false;

    const tryComplete = () => {
      if (transitioning) return;
      if (!tf.isComplete()) return;

      transitioning = true;

      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start("TerraformingComplete");
      });
    };

    tf.on("maybeComplete", tryComplete);
    this.onShutdown(() => tf.off("maybeComplete", tryComplete));

    this.planet = new TerraformPlanet(this, 960, 540);

    this.add.existing(this.planet);
    this.bgCam.ignore(this.planet);

    const atmosphere = new Atmosphere(this, 960, 1200, {
      diameter: 2200,
      offsetRatio: 0.62,
      arcStartDeg: 225,
      arcEndDeg: 315,
      radiusOffset: 54,
    });
    this.add.existing(atmosphere);
    this.bgCam.ignore(atmosphere);

    const magnetosphere = new Magnetosphere(this, 960, -120, {
      diameter: 2200,
      offsetRatio: 0.62,
      arcStartDeg: 45,
      arcEndDeg: 135,
      radiusOffset: 54,
    });
    this.add.existing(magnetosphere);
    this.bgCam.ignore(magnetosphere);

    const hydrosphere = new Hydrosphere(this, 960, 540);
    this.add.existing(hydrosphere);
    this.bgCam.ignore(hydrosphere);

    atmosphere.setVisible(false);
    magnetosphere.setVisible(false);
    hydrosphere.setVisible(false);
    this.planet.setVisible(true);

    const onGoToPlanet = () => {
      atmosphere.setVisible(false);
      magnetosphere.setVisible(false);
      hydrosphere.setVisible(false);
      this.planet.setVisible(true);
    };

    const onGoToAtmosphere = () => {
      this.planet.setVisible(false);
      magnetosphere.setVisible(false);
      hydrosphere.setVisible(false);
      atmosphere.setVisible(true);
    };

    const onGoToMagnetosphere = () => {
      this.planet.setVisible(false);
      atmosphere.setVisible(false);
      hydrosphere.setVisible(false);
      magnetosphere.setVisible(true);
    };

    const onGoToHydrosphere = () => {
      this.planet.setVisible(false);
      atmosphere.setVisible(false);
      magnetosphere.setVisible(false);
      hydrosphere.setVisible(true);
    }

    this.events.on("ui:goToPlanet", onGoToPlanet);
    this.events.on("ui:goToAtmosphere", onGoToAtmosphere);
    this.events.on("ui:goToMagnetosphere", onGoToMagnetosphere);
    this.events.on("ui:goToHydrosphere", onGoToHydrosphere);

    this.onShutdown(() => {
      this.events.off("ui:goToPlanet", onGoToPlanet);
      this.events.off("ui:goToAtmosphere", onGoToAtmosphere);
      this.events.off("ui:goToMagnetosphere", onGoToMagnetosphere);
      this.events.off("ui:goToHydrosphere", onGoToHydrosphere);
    });
  }
}
