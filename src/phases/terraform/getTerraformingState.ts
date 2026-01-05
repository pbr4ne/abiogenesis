import Phaser from "phaser";
import PlanetRunState from "../../planet/PlanetRunState";
import TerraformingFacade from "./TerraformingFacade";

export const getTerraforming = (scene: Phaser.Scene) => {
  const key = "terraforming";
  let t = scene.registry.get(key) as TerraformingFacade | undefined;
  if (!t) {
    const run = scene.registry.get("run") as PlanetRunState;
    t = new TerraformingFacade(run);
    scene.registry.set(key, t);
  }
  return t;
};
