import Phaser from "phaser";
import TerraformingFacade from "./TerraformingFacade";
import { getRun } from "../../utilities/GameSession";

export const getTerraforming = (scene: Phaser.Scene) => {
  const run = getRun();
  return (run.terraformingFacade ??= new TerraformingFacade(run));
};
