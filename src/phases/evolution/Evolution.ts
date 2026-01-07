import Phaser from "phaser";
import PhaseScene from "../../scenes/PhaseScene";
import Planet from "./EvolutionPlanet";
import LifePanel from "./LifeDetailsHover";
import LifeDetailsModal from "./LifeDetailsModal";
import { LifeFormDef, LifeFormInstance } from "./EvolutionTypes";
import EvolutionTreeModal from "./EvolutionTreeModal";
import EvolutionTreeButton from "./EvolutionTreeButton";
import PlanetRunState from "../../planet/PlanetRunState";
import EvolutionSim from "./EvolutionSim";
import AbacusPoints from "./AbacusPoints";
import EvolutionTop3Hud from "./EvolutionTop3Hud";
import EvolutionCometButton from "./EvolutionCometButton";

export default class Evolution extends PhaseScene {
  private run!: PlanetRunState;
  private planet!: Planet;
  private hoverPanel!: LifePanel;
  private modal!: LifeDetailsModal;
  private evoModal!: EvolutionTreeModal;
  private evoBtn!: EvolutionTreeButton;
  private sim!: EvolutionSim;
  private simTimer?: Phaser.Time.TimerEvent;
  private abacusPoints!: AbacusPoints;
  private lastEvoPts = -1;
  private cometBtn!: EvolutionCometButton;
  private cometArmed = false;
  private prevCanvasCursor: string | null = null;
  private forceCrosshair?: () => void;

  constructor() {
    super("Evolution");
  }

  protected createPhase() {
    this.planet = new Planet(this, 960, 540);
    this.add.existing(this.planet);
    this.bgCam.ignore(this.planet);

    this.run = this.registry.get("run") as PlanetRunState;

    this.abacusPoints = new AbacusPoints(this, {
      x: 250,
      y: 360,
      getPoints: (): number => this.run.getEvoPointsAvailable(),
      maxPoints: 1000,
      width: 350
    });
    this.add.existing(this.abacusPoints);

    this.sim = new EvolutionSim(this.run, 40);

    this.simTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.sim.tick();

        const pts = this.run.getEvoPointsAvailable();
        if (pts !== this.lastEvoPts) {
          this.lastEvoPts = pts;
          this.events.emit("evoPoints:changed", pts);
          this.cometBtn.refresh();
        }

        this.planet.refreshFromRun();
        this.abacusPoints.refresh();
        if (this.evoModal.isOpen()) this.evoModal.show(this.run.lifeForms);
      }
    });

    const topHud = new EvolutionTop3Hud(this, () => this.run.lifeForms);

    this.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => topHud.refresh()
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.simTimer?.remove(false);
      this.simTimer = undefined;
    });

    this.hoverPanel = new LifePanel(this);
    this.modal = new LifeDetailsModal(this);

    this.evoModal = new EvolutionTreeModal(this);

    this.evoBtn = new EvolutionTreeButton(this, () => {
      if (this.evoModal.isOpen()) {
        this.evoModal.hide();
        this.hoverPanel.hide();
        this.cometBtn.setHiddenForMainHover(false);
      } else {
        this.evoModal.show(this.run.lifeForms);
        this.cometBtn.refresh();
      }
    });

    this.add.existing(this.evoBtn);

    this.cometBtn = new EvolutionCometButton({
      scene: this,
      getPoints: () => this.run.getEvoPointsAvailable(),
      minPointsToShow: 1,
      onClick: () => {
        if (this.cometArmed) {
          this.setCometArmed(false);
          return;
        }

        if (this.run.getEvoPointsAvailable() < 1) return;
        this.setCometArmed(true);
      }
    });
    this.add.existing(this.cometBtn);

    this.cometBtn.refresh();

    const cancelCometOnOutsideClick = (pointer: Phaser.Input.Pointer) => {
      if (!this.cometArmed) return;

      const cometBounds = this.cometBtn.getBounds();
      if (cometBounds.contains(pointer.worldX, pointer.worldY)) return;

      const dx = pointer.worldX - this.planet.x;
      const dy = pointer.worldY - this.planet.y;
      const r = (this.planet as any).r ?? 384;
      const isPlanetClick = dx * dx + dy * dy <= r * r;
      if (isPlanetClick) return;

      this.setCometArmed(false);
    };

    this.input.on(Phaser.Input.Events.POINTER_DOWN, cancelCometOnOutsideClick);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_DOWN, cancelCometOnOutsideClick);
    });

    const layoutComet = () => {
      const pad = 22;
      const size = 200;
      this.cometBtn.setDisplaySize(size, size);
      this.cometBtn.setPosition(this.scale.width - pad - size / 2 - 200, this.scale.height / 2 - 50);
    };

    layoutComet();
    this.scale.on(Phaser.Scale.Events.RESIZE, layoutComet);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, layoutComet);
      this.setCometArmed(false);
    });

    this.events.on(
      "life:hoverAt",
      (e: { payload: { lf: LifeFormInstance; def: LifeFormDef }; x: number; y: number; size: number } | null) => {
        if (!e) {
          this.hoverPanel.hide();
          return;
        }

        this.hoverPanel.setLifeAt(e.payload, e.x, e.y, e.size);
      }
    );

    this.events.on("life:hover", (p: { lf: LifeFormInstance; def: LifeFormDef } | null) => {
      if (this.evoModal.isOpen()) return;
      this.hoverPanel.setLife(p);
      this.cometBtn.setHiddenForMainHover(!!p);
    });

    this.events.on("life:select", (payload: { lf: LifeFormInstance; def: LifeFormDef }) => {
      this.hoverPanel.setLife(null);
      this.cometBtn.setHiddenForMainHover(false);
      this.modal.show(payload);
    });

    this.events.on(
      "comet:target",
      (e: { row: number; col: number; x: number; y: number }) => {
        if (!this.cometArmed) return;

        this.setCometArmed(false);

        const fromX = this.scale.width + 120;
        const fromY = -120;

        this.playCometStrike(fromX, fromY, e.x, e.y, () => {
          this.kill3x3At(e.row, e.col);
          this.planet.refreshFromRun();
          this.abacusPoints.refresh();
          this.cometBtn.refresh();
        });
      }
    );
  }

  public setUseHandCursor(on: boolean) {
    if (!this.input) return;
    (this.input as any).useHandCursor = on;
  }

  private setCometArmed(on: boolean) {
    if (this.cometArmed === on) return;
    this.cometArmed = on;

    const canvas = this.game.canvas as HTMLCanvasElement | undefined;

    if (on) {
      if (canvas && this.prevCanvasCursor === null) {
        this.prevCanvasCursor = canvas.style.cursor || "";
      }

      this.cometBtn.setUseHandCursor(false);
      this.cometBtn.setArmedVisual(true);

      (this.planet as any).setCometMode?.(true);

      this.input.setDefaultCursor("crosshair");
      if (canvas) canvas.style.cursor = "crosshair";

      const force = () => {
        if (!this.cometArmed) return;
        this.input.setDefaultCursor("crosshair");
        if (canvas) canvas.style.cursor = "crosshair";
      };

      this.forceCrosshair = force;
      this.input.on(Phaser.Input.Events.POINTER_MOVE, force);
      this.input.on(Phaser.Input.Events.POINTER_OVER, force);

      this.hoverPanel.setLife(null);
      this.cometBtn.setHiddenForMainHover(false);
    } else {
      (this.planet as any).setCometMode?.(false);

      if (this.forceCrosshair) {
        this.input.off(Phaser.Input.Events.POINTER_MOVE, this.forceCrosshair);
        this.input.off(Phaser.Input.Events.POINTER_OVER, this.forceCrosshair);
        this.forceCrosshair = undefined;
      }

      this.cometBtn.setUseHandCursor(true);
      this.cometBtn.setArmedVisual(false);

      if (canvas) canvas.style.cursor = this.prevCanvasCursor ?? "";
      this.prevCanvasCursor = null;

      this.input.setDefaultCursor("default");
    }
  }

  private kill3x3At(row: number, col: number) {
    const div = (this.planet as any).divisions ?? 40;

    const keys = new Set<string>();

    for (let dr = -1; dr <= 1; dr++) {
      const rr = row + dr;
      if (rr < 0 || rr >= div) continue;

      for (let dc = -1; dc <= 1; dc++) {
        const cc = (col + dc + div) % div;
        keys.add(`${rr},${cc}`);
      }
    }

    const runAny = this.run as any;
    if (!Array.isArray(runAny.lifeForms)) return;

    runAny.lifeForms = runAny.lifeForms.filter((lf: any) => !keys.has(`${lf.row},${lf.col}`));
  }

  private playCometStrike(fromX: number, fromY: number, toX: number, toY: number, done: () => void) {
    const g = this.add.graphics();
    g.setDepth(20000);

    const payload = { x: fromX, y: fromY, t: 0 };

    const draw = () => {
      g.clear();

      const steps = 10;
      for (let i = 0; i < steps; i++) {
        const tt = Math.max(0, payload.t - i * 0.06);
        const x = Phaser.Math.Linear(fromX, toX, tt);
        const y = Phaser.Math.Linear(fromY, toY, tt);

        const a = 0.22 * (1 - i / steps);
        const r = Phaser.Math.Linear(28, 6, i / steps);

        g.fillStyle(0xffaa33, a);
        g.fillCircle(x, y, r);
        g.fillStyle(0xff4422, a * 0.7);
        g.fillCircle(x, y, r * 0.65);
      }

      g.fillStyle(0xffee88, 0.95);
      g.fillCircle(payload.x, payload.y, 10);
      g.fillStyle(0xff5522, 0.75);
      g.fillCircle(payload.x, payload.y, 16);
    };

    const tw = this.tweens.add({
      targets: payload,
      x: toX,
      y: toY,
      t: 1,
      duration: 650,
      ease: "Cubic.easeIn",
      onUpdate: draw,
      onComplete: () => {
        g.destroy();

        const boom = this.add.graphics();
        boom.setDepth(20001);

        this.cameras.main.shake(90, 0.009);
        this.time.delayedCall(90, () => {
          this.cameras.main.shake(120, 0.004);
        });

        this.tweens.add({
          targets: { t: 0 },
          t: 1,
          duration: 360,
          ease: "Quad.easeOut",
          onUpdate: tween => {
            const t = (tween.targets[0] as any).t as number;

            const r = Phaser.Math.Linear(10, 110, t);
            const a = 0.85 * (1 - t);

            boom.clear();
            boom.fillStyle(0xffcc55, a);
            boom.fillCircle(toX, toY, r);
            boom.fillStyle(0xff3322, a * 0.55);
            boom.fillCircle(toX, toY, r * 0.62);
          },
          onComplete: () => {
            boom.destroy();
            done();
          }
        });
      }
    });

    draw();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      tw.remove();
      g.destroy();
    });
  }
}
