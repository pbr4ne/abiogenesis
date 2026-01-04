import Phaser from "phaser";
import { LifeFormDef, LifeFormInstance, LifeFormType } from "./EvolutionTypes";
import { LIFEFORMS } from "./LifeForms";

const rgbToHex = (r: number, g: number, b: number) => (r << 16) | (g << 8) | b;

type NodeCfg = { type: LifeFormType; x: number; y: number; size: number };
type EdgeCfg = { from: LifeFormType; to: LifeFormType };

type NodeObj = {
  cfg: NodeCfg;
  def: LifeFormDef;
  bg: Phaser.GameObjects.Arc;
  icon: Phaser.GameObjects.Image;
  ring: Phaser.GameObjects.Arc;
  countText: Phaser.GameObjects.Text;
};

export default class EvolutionTreeModal extends Phaser.GameObjects.Container {
  private backdrop: Phaser.GameObjects.Rectangle;
  private panel: Phaser.GameObjects.Rectangle;

  private closeHit: Phaser.GameObjects.Rectangle;
  private closeText: Phaser.GameObjects.Text;

  private g: Phaser.GameObjects.Graphics;

  private nodes = new Map<LifeFormType, NodeObj>();
  private edges: EdgeCfg[] = [];

  private panelCx = 0;
  private panelCy = 0;

  private basePos = new Map<LifeFormType, { x: number; y: number }>();

  private lifeForms: LifeFormInstance[] = [];
  private firstByType = new Map<LifeFormType, LifeFormInstance>();

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    const sw = scene.scale.width;
    const sh = scene.scale.height;

    this.backdrop = scene.add.rectangle(0, 0, sw, sh, 0x000000, 0.55).setOrigin(0, 0);
    this.backdrop.setInteractive();

    const w = Math.min(1700, sw - 40);
    const h = Math.min(900, sh - 40);

    const cx = sw / 2;
    const cy = sh / 2;

    this.panelCx = cx;
    this.panelCy = cy;

    this.panel = scene.add.rectangle(cx, cy, w, h, 0x0b0b0b, 0.96);
    this.panel.setStrokeStyle(3, 0xffffff, 0.25);

    const pad = 26;

    const closeW = 44;
    const closeH = 36;
    const closeX = cx + w / 2 - pad - closeW / 2;
    const closeY = cy - h / 2 + pad + closeH / 2 - 4;

    this.closeHit = scene.add.rectangle(closeX, closeY, closeW, closeH, 0x000000, 0);
    this.closeHit.setInteractive({ useHandCursor: true });

    this.closeText = scene.add.text(closeX, closeY, "✕", {
      fontFamily: "Arial",
      fontSize: "26px",
      color: "#ffffff"
    }).setOrigin(0.5, 0.5);

    this.g = scene.add.graphics();

    this.add([this.backdrop, this.panel, this.g, this.closeHit, this.closeText]);

    this.setScrollFactor(0);
    this.setDepth(10000);
    this.setVisible(false);

    this.backdrop.on("pointerdown", () => this.hide());
    this.closeHit.on("pointerdown", () => this.hide());

    this.buildLayout(w, h, cx, cy, pad);
    scene.add.existing(this);
  }

  private buildLayout(panelW: number, panelH: number, cx: number, cy: number, pad: number) {
    const left = cx - panelW / 2 + pad + 100;
    const top = cy - panelH / 2 + pad;

    const cols = [
      left + 0,
      left + 180,
      left + 360,
      left + 590,
      left + 780,
      left + 950,
      left + 1120,
      left + 1290,
      left + 1460
    ];

    const col = (i: number) => cols[i] ?? (left + i * 180);
    const row = (i: number) => top + i * 150;

    const N: NodeCfg[] = [
      { type: "prokaryote", x: col(0), y: row(2), size: 86 },

      { type: "eukaryote", x: col(1), y: row(2), size: 82 },
      { type: "virus", x: col(1), y: row(4), size: 72 },

      { type: "algae", x: col(2), y: row(1), size: 76 },
      { type: "mollusk", x: col(2), y: row(2.5), size: 76 },
      { type: "fungi", x: col(2), y: row(4), size: 76 },

      { type: "tree", x: col(3), y: row(0.3), size: 70 },
      { type: "flower", x: col(3), y: row(1.3), size: 70 },

      { type: "fish", x: col(3), y: row(2.0), size: 72 },
      { type: "octopus", x: col(3), y: row(3.1), size: 70 },
      { type: "insect", x: col(3), y: row(4.2), size: 70 },

      { type: "crystal", x: col(3), y: row(5.2), size: 72 },

      { type: "amphibian", x: col(4), y: row(2.0), size: 72 },
      { type: "reptile", x: col(5), y: row(2.0), size: 72 },

      { type: "dinosaur", x: col(6), y: row(1.0), size: 70 },
      { type: "rodent", x: col(6), y: row(3.0), size: 70 },

      { type: "bird", x: col(7), y: row(0.4), size: 66 },
      { type: "cat", x: col(7), y: row(2.3), size: 66 },
      { type: "whale", x: col(7), y: row(3.3), size: 66 },
      { type: "ape", x: col(7), y: row(4.4), size: 66 },

      { type: "human", x: col(8), y: row(3.9), size: 64 },
      { type: "alien", x: col(8), y: row(4.9), size: 64 }
    ];

    this.edges = [
      { from: "prokaryote", to: "eukaryote" },
      { from: "prokaryote", to: "virus" },

      { from: "eukaryote", to: "algae" },
      { from: "eukaryote", to: "mollusk" },
      { from: "eukaryote", to: "fungi" },

      { from: "algae", to: "tree" },
      { from: "algae", to: "flower" },

      { from: "mollusk", to: "fish" },
      { from: "mollusk", to: "octopus" },
      { from: "mollusk", to: "insect" },

      { from: "fish", to: "amphibian" },
      { from: "amphibian", to: "reptile" },

      { from: "reptile", to: "dinosaur" },
      { from: "reptile", to: "rodent" },

      { from: "dinosaur", to: "bird" },

      { from: "rodent", to: "cat" },
      { from: "rodent", to: "whale" },
      { from: "rodent", to: "ape" },

      { from: "ape", to: "human" },
      { from: "ape", to: "alien" },

      { from: "fungi", to: "crystal" }
    ];

    for (const cfg of N) {
      const def = LIFEFORMS[cfg.type];
      const tint = rgbToHex(def.colour.r, def.colour.g, def.colour.b);

      const bg = this.scene.add.circle(cfg.x, cfg.y, cfg.size * 0.62, 0x0b0b0b, 1) as Phaser.GameObjects.Arc;

      const icon = this.scene.add.image(cfg.x, cfg.y, def.type).setDisplaySize(cfg.size, cfg.size);
      icon.setTintFill(tint);

      const ring = this.scene.add.circle(cfg.x, cfg.y, cfg.size * 0.66, 0x000000, 0) as Phaser.GameObjects.Arc;
      ring.setStrokeStyle(5, tint, 0.85);

      const countText = this.scene.add.text(cfg.x, cfg.y + cfg.size * 0.62, "0", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff"
      }).setOrigin(0.5, 0.5);

      this.basePos.set(cfg.type, { x: cfg.x, y: cfg.y });

      icon.setInteractive({ useHandCursor: true });
      icon.on("pointerover", () => this.emitTreeHoverAt(cfg.type));
      bg.on("pointerover", () => this.emitTreeHoverAt(cfg.type));

      bg.setInteractive({ useHandCursor: true });
      icon.on("pointerout", () => this.scene.events.emit("life:hoverAt", null));
      bg.on("pointerout", () => this.scene.events.emit("life:hoverAt", null));


      const obj: NodeObj = { cfg, def, bg, icon, ring, countText };
      this.nodes.set(cfg.type, obj);
      this.add([bg, ring, icon, countText]);
    }
  }

  private emitTreeHoverAt(type: LifeFormType) {
    const node = this.nodes.get(type);
    if (!node) {
      this.scene.events.emit("life:hoverAt", null);
      return;
    }

    const lf = this.firstByType.get(type);
    if (!lf) {
      this.scene.events.emit("life:hoverAt", null);
      return;
    }

    const x = node.icon.x;
    const y = node.icon.y;
    const size = node.cfg.size;

    this.scene.events.emit("life:hoverAt", { payload: { lf, def: node.def }, x, y, size });
  }

  public show(lifeForms: LifeFormInstance[]) {
    this.lifeForms = lifeForms;

    this.firstByType.clear();
    for (const lf of lifeForms) {
      if (!this.firstByType.has(lf.type)) this.firstByType.set(lf.type, lf);
    }

    const counts = this.countByType(lifeForms);

    for (const [type, node] of this.nodes) {
      const c = counts.get(type) ?? 0;

      const tint = rgbToHex(node.def.colour.r, node.def.colour.g, node.def.colour.b);
      node.icon.setTintFill(tint);
      node.ring.setStrokeStyle(5, tint, 0.85);

      const visible = c > 0;
      node.icon.setVisible(visible);
      node.ring.setVisible(visible);
      node.countText.setVisible(false);
      node.bg.setVisible(visible);
    }

    this.centerVisibleSubtree(counts);
    this.redrawEdges(counts);
    this.setVisible(true);
  }

  public hide() {
    this.scene.events.emit("life:hoverAt", null);
    this.setVisible(false);
  }

  public isOpen() {
    return this.visible;
  }

  private countByType(lifeForms: LifeFormInstance[]) {
    const m = new Map<LifeFormType, number>();
    for (const lf of lifeForms) {
      m.set(lf.type, (m.get(lf.type) ?? 0) + 1);
    }
    return m;
  }

  private centerVisibleSubtree(counts: Map<LifeFormType, number>) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let any = false;

    for (const [type, node] of this.nodes) {
      if ((counts.get(type) ?? 0) <= 0) continue;

      const base = this.basePos.get(type);
      if (!base) continue;

      const r = node.cfg.size * 0.66;
      minX = Math.min(minX, base.x - r);
      maxX = Math.max(maxX, base.x + r);
      minY = Math.min(minY, base.y - r);
      maxY = Math.max(maxY, base.y + r);
      any = true;
    }

    if (!any) return;

    const bboxCx = (minX + maxX) / 2;
    const bboxCy = (minY + maxY) / 2;

    const dx = this.panelCx - bboxCx;
    const dy = this.panelCy - bboxCy;

    for (const [type, node] of this.nodes) {
      const base = this.basePos.get(type);
      if (!base) continue;

      const x = base.x + dx;
      const y = base.y + dy;

      node.cfg.x = x;
      node.cfg.y = y;

      node.bg.setPosition(x, y);
      node.icon.setPosition(x, y);
      node.ring.setPosition(x, y);

      node.countText.setPosition(x, y + node.cfg.size * 0.62);
    }
  }

  private redrawEdges(counts: Map<LifeFormType, number>) {
    this.g.clear();

    for (const e of this.edges) {
      const from = this.nodes.get(e.from);
      const to = this.nodes.get(e.to);
      if (!from || !to) continue;

      const fromC = counts.get(e.from) ?? 0;
      const toC = counts.get(e.to) ?? 0;

      if (fromC <= 0 || toC <= 0) continue;

      const tint = rgbToHex(to.def.colour.r, to.def.colour.g, to.def.colour.b);

      const ax = from.cfg.x + from.cfg.size * 0.45;
      const ay = from.cfg.y;
      const bx = to.cfg.x - to.cfg.size * 0.45;
      const by = to.cfg.y;

      const mx = (ax + bx) / 2;

      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(ax, ay),
        new Phaser.Math.Vector2(mx, ay),
        new Phaser.Math.Vector2(bx, by)
      );

      this.g.lineStyle(6, tint, 0.65);
      curve.draw(this.g);


      const pts = curve.getPoints(12);
      const p0 = pts[pts.length - 2];
      const p1 = pts[pts.length - 1];

      const dir = new Phaser.Math.Vector2(p1.x - p0.x, p1.y - p0.y).normalize();

      const px = p1.x - dir.x * 10;
      const py = p1.y - dir.y * 10;

      const left = dir.clone().rotate(Math.PI * 0.75).scale(10);
      const right = dir.clone().rotate(-Math.PI * 0.75).scale(10);

      this.g.fillStyle(tint, 0.85);
      this.g.beginPath();
      this.g.moveTo(px, py);
      this.g.lineTo(px + left.x, py + left.y);
      this.g.lineTo(px + right.x, py + right.y);
      this.g.closePath();
      this.g.fillPath();
    }
  }
}
