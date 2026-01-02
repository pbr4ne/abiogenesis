import Phaser from "phaser";
import Preload from "./scenes/Preload";
import Welcome from "./scenes/Welcome";
import Init from "./scenes/Init";
import Terraforming from "./scenes/Terraforming";
import PrimordialSoup from "./scenes/PrimoridalSoup";
import Evolution from "./scenes/Evolution";
import GalaxyMap from "./scenes/GalaxyMap";

const game = new Phaser.Game({
  width: 1920,
  height: 1080,
  backgroundColor: "#0f0f0f",
  scale: {
    mode: Phaser.Scale.ScaleModes.FIT,
    autoCenter: Phaser.Scale.Center.CENTER_BOTH,
  },
  physics: { default: "arcade" },
  scene: [Preload, Init, Welcome, Terraforming, PrimordialSoup, Evolution, GalaxyMap],
  transparent: false,
  input: { activePointers: 3 },
});

game.scene.start("Preload");
