import Phaser from "phaser";
import { getRun } from "./GameSession";
import { log } from "./GameUtils";

type DebugNextCfg = {
  scene: Phaser.Scene;
  next: string;
  data?: any;
  requireShift?: boolean;
};

export const enableDebugNext = (cfg: DebugNextCfg) => {
  const { scene, next, data, requireShift = true } = cfg;

  const needsWater10 = (sceneKey: string) =>
    sceneKey === "Terraforming" || sceneKey === "PrimordialSoup";

  const canHandle = () => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return true;
    const tag = (el.tagName || "").toLowerCase();
    return tag !== "input" && tag !== "textarea";
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!canHandle()) return;
    if (requireShift && !e.shiftKey) return;
    if (e.code !== "KeyN") return;

    if (needsWater10(next)) {
      const run = getRun();
      run.waterLevel = 10;
    }
    log(`Debug: navigating to ${next}`);
    log(`Water level is now ${getRun().waterLevel}`);
    scene.scene.start(next, data);
  };

  scene.input.keyboard?.on("keydown", onKeyDown);

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.input.keyboard?.off("keydown", onKeyDown);
  });
};
