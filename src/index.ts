import Phaser from "phaser";
import Preload from "./scenes/Preload";
import Welcome from "./scenes/Welcome";
import Init from "./scenes/Init";
import Terraforming from "./phases/terraform/Terraforming";
import PrimordialSoup from "./phases/primordial/PrimoridalSoup";
import Evolution from "./phases/evolution/Evolution";
import GalaxyMap from "./phases/galaxy/GalaxyMap";
import TerraformingComplete from "./phases/terraform/TerraformingComplete";
import PrimordialSoupComplete from "./phases/primordial/PrimordialSoupComplete";
import EvolutionComplete from "./phases/evolution/EvolutionComplete";
import EndGame from "./scenes/EndGame";

const game = new Phaser.Game({
  width: 1920,
  height: 1080,
  backgroundColor: "#0f0f0f",
  scale: {
    mode: Phaser.Scale.ScaleModes.FIT,
    autoCenter: Phaser.Scale.Center.CENTER_BOTH,
  },
  physics: { default: "arcade" },
  scene: [Preload, Init, Welcome, Terraforming, TerraformingComplete, PrimordialSoup, PrimordialSoupComplete, Evolution, EvolutionComplete, GalaxyMap, EndGame],
  transparent: false,
  input: { activePointers: 3 },
});

game.scene.start("Preload");
