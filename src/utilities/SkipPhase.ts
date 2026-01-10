import Phaser from "phaser";
import { getRun } from "./GameSession";
import { log } from "./GameUtils";

type SkipPhaseCfg = {
  scene: Phaser.Scene;
  next: string;
  data?: any;
  requireShift?: boolean;
};

const SKIP_PHASE_FN_PROP = "__skipPhaseFn";

export const invokeSkipPhase = (scene: Phaser.Scene) => {
  const fn = (scene as any)[SKIP_PHASE_FN_PROP] as (() => void) | undefined;
  if (!fn) return false;
  fn();
  return true;
};

export const enableSkipPhase = (cfg: SkipPhaseCfg) => {
  const { scene, next, data, requireShift = true } = cfg;

  const needsWater10 = (sceneKey: string) =>
    sceneKey === "Terraforming" || sceneKey === "PrimordialSoup";

  const canHandle = () => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return true;
    const tag = (el.tagName || "").toLowerCase();
    return tag !== "input" && tag !== "textarea";
  };

  const go = () => {
    if (needsWater10(next)) {
      const run = getRun();
      run.waterLevel = 10;
    }
    log(`Debug: navigating to ${next}`);
    log(`Water level is now ${getRun().waterLevel}`);
    scene.scene.start(next, data);
  };

  (scene as any)[SKIP_PHASE_FN_PROP] = go;

  const onKeyDown = (e: KeyboardEvent) => {
    if (!canHandle()) return;
    if (requireShift && !e.shiftKey) return;
    if (e.code !== "KeyN") return;
    go();
  };

  scene.input.keyboard?.on("keydown", onKeyDown);

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.input.keyboard?.off("keydown", onKeyDown);
    delete (scene as any)[SKIP_PHASE_FN_PROP];
  });
};
