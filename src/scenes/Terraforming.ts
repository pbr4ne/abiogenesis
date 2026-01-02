import Planet from "../prefabs/TerraformPlanet";
import Atmosphere from "../prefabs/Atmosphere";
import Magnetosphere from "../prefabs/Magnetosphere";
import PhaseScene from "./PhaseScene";

export default class Terraforming extends PhaseScene {
  public planet!: Planet;

  constructor() {
    super("Terraforming");
  }

  protected createPhase() {
    this.planet = new Planet(this, 960, 540);
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

    atmosphere.setVisible(false);
    magnetosphere.setVisible(false);
    this.planet.setVisible(true);

    const onGoToPlanet = () => {
      atmosphere.setVisible(false);
      magnetosphere.setVisible(false);
      this.planet.setVisible(true);
    };

    const onGoToAtmosphere = () => {
      this.planet.setVisible(false);
      magnetosphere.setVisible(false);
      atmosphere.setVisible(true);
    };

    const onGoToMagnetosphere = () => {
      this.planet.setVisible(false);
      atmosphere.setVisible(false);
      magnetosphere.setVisible(true);
    };

    this.events.on("ui:goToPlanet", onGoToPlanet);
    this.events.on("ui:goToAtmosphere", onGoToAtmosphere);
    this.events.on("ui:goToMagnetosphere", onGoToMagnetosphere);

    this.onShutdown(() => {
      this.events.off("ui:goToPlanet", onGoToPlanet);
      this.events.off("ui:goToAtmosphere", onGoToAtmosphere);
      this.events.off("ui:goToMagnetosphere", onGoToMagnetosphere);
    });
  }
}
